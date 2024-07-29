--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3
-- Dumped by pg_dump version 16.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: add_layer(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_layer() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    max_layer INT;
BEGIN
    -- Get the maximum layer value plus 1
    SELECT COALESCE(MAX(layer), 4999999) + 1 INTO max_layer FROM layers;

    -- Insert into layers based on the triggering table
    IF (TG_TABLE_NAME = 'bars') THEN
        INSERT INTO layers (foreign_id, foreign_table, layer) 
        VALUES (NEW.bar_id, 2, max_layer);
    ELSIF (TG_TABLE_NAME = 'lists') THEN
        INSERT INTO layers (foreign_id, foreign_table, layer) 
        VALUES (NEW.list_id, 1, max_layer);
    ELSIF (TG_TABLE_NAME = 'shops') THEN
        INSERT INTO layers (foreign_id, foreign_table, layer) 
        VALUES (NEW.shop_id, 3, max_layer);
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.add_layer() OWNER TO postgres;

--
-- Name: create_related_entries(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_related_entries() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    /* INSERT INTO rewards (task_id) VALUES (NEW.task_id); */
    INSERT INTO properties (task_id) VALUES (NEW.task_id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_related_entries() OWNER TO postgres;

--
-- Name: delete_layer_if_referenced_bar(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_layer_if_referenced_bar() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Delete layer if it's a bar and referenced record is deleted
    DELETE FROM layers WHERE foreign_id = OLD.bar_id AND foreign_table = 2;
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.delete_layer_if_referenced_bar() OWNER TO postgres;

--
-- Name: delete_layer_if_referenced_shop(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_layer_if_referenced_shop() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Delete layer if it's a shop and referenced record is deleted
    DELETE FROM layers WHERE foreign_id = OLD.shop_id AND foreign_table = 3;
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.delete_layer_if_referenced_shop() OWNER TO postgres;

--
-- Name: delete_layer_if_referenced_task_list(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_layer_if_referenced_task_list() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Delete layer if it's a task_list and referenced record is deleted
    DELETE FROM layers WHERE foreign_id = OLD.list_id AND foreign_table = 1;
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.delete_layer_if_referenced_task_list() OWNER TO postgres;

--
-- Name: delete_nested_tasks(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_nested_tasks() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Delete all tasks with nested_id equal to the deleted task_id
    DELETE FROM tasks
    WHERE nested_id = OLD.task_id;

    -- Delete the initial task itself
    DELETE FROM tasks
    WHERE task_id = OLD.task_id;

    RETURN OLD;
END;
$$;


ALTER FUNCTION public.delete_nested_tasks() OWNER TO postgres;

--
-- Name: handle_task_completion(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_task_completion(p_task_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    trans RECORD;
    vouch RECORD;
    nested_task RECORD;
BEGIN
    -- Clone the task data into tasks_history
    INSERT INTO tasks_history (task_id, list_id, task_name, nested_id, created_date_time)
    SELECT t.task_id, t.list_id, t.task_name, t.nested_id, t.created_date_time
    FROM tasks t
    WHERE t.task_id = p_task_id;

    -- Temporarily disable the delete_nested_tasks trigger
    PERFORM 'ALTER TABLE tasks DISABLE TRIGGER delete_nested_tasks';

    -- Handle transactions associated with the task
    FOR trans IN
        SELECT * FROM Transactions
        WHERE task_id = p_task_id
    LOOP
        -- Update the Currencies table by adding the transaction amount to the corresponding currency_id
        UPDATE Currencies
        SET owned = owned + trans.amount
        WHERE currency_id = trans.currency_id;
        
    END LOOP;

    -- Handle vouchers associated with the task
    FOR vouch IN
        SELECT * FROM Vouchers
        WHERE task_id = p_task_id
    LOOP
        -- Distribute the voucher amount (in this case, decrement quantity) to the corresponding bar_id
        UPDATE items
        SET storage = storage + vouch.quantity
        WHERE item_id = vouch.item_id;

    END LOOP;

    -- Complete the nested tasks
	IF (SELECT list_id FROM tasks WHERE task_id = p_task_id) IS NOT NULL THEN
	    FOR nested_task IN
	        SELECT * FROM tasks
	        WHERE nested_id = p_task_id
	    LOOP
	        PERFORM handle_task_completion(nested_task.task_id);
	    END LOOP;
	END IF;

    -- Update bar and distribute transactions
    PERFORM update_bar_and_distribute_transactions(p_task_id);

    IF (SELECT list_id FROM tasks WHERE task_id = p_task_id) IS NOT NULL THEN
        -- Delete the original task
        DELETE FROM tasks WHERE task_id = p_task_id;
    END IF;

    -- Re-enable the delete_nested_tasks trigger
    PERFORM 'ALTER TABLE tasks ENABLE TRIGGER delete_nested_tasks';
END;
$$;


ALTER FUNCTION public.handle_task_completion(p_task_id integer) OWNER TO postgres;

--
-- Name: move_to_higher(integer, smallint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.move_to_higher(p_foreign_id integer, p_foreign_table smallint) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    chosen_layer INT;
    highest_layer INT;
    new_layer INT;
BEGIN
    -- Determine the chosen layer based on foreign_id and foreign_table
    SELECT layer INTO chosen_layer FROM layers 
    WHERE foreign_id = p_foreign_id AND foreign_table = p_foreign_table;

    -- Find the highest layer
    SELECT COALESCE(MAX(layer), 4999999) INTO highest_layer FROM layers;

    -- Check if the chosen layer is the highest
    IF chosen_layer = highest_layer THEN
        RETURN;
    END IF;

    -- Calculate the new layer
    new_layer := highest_layer + 1;

    -- Check if the new layer exceeds the maximum allowed layer value
    IF new_layer >= 6000000 THEN
        -- Call the reset_layers function if the new layer exceeds the limit
        PERFORM reset_layers();
        -- Recalculate the highest layer and set the new layer
        SELECT COALESCE(MAX(layer), 4999999) + 1 INTO highest_layer FROM layers;
        new_layer := highest_layer;
    END IF;

    -- Update the chosen layer to the new layer
    UPDATE layers 
    SET layer = new_layer 
    WHERE foreign_id = p_foreign_id AND foreign_table = p_foreign_table;

END;
$$;


ALTER FUNCTION public.move_to_higher(p_foreign_id integer, p_foreign_table smallint) OWNER TO postgres;

--
-- Name: reset_layers(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reset_layers() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    r RECORD;
    counter INT := 0;
BEGIN
    -- Iterate over all layers in ascending order
    FOR r IN (SELECT layer_id, layer FROM layers ORDER BY layer) LOOP
        -- Update each layer to the new value
        UPDATE layers 
        SET layer = 5000000 + counter
        WHERE layer_id = r.layer_id;
        
        -- Increment the counter
        counter := counter + 1;
    END LOOP;
END;
$$;


ALTER FUNCTION public.reset_layers() OWNER TO postgres;

--
-- Name: update_bar_and_distribute_transactions(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_bar_and_distribute_transactions(p_task_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    reward RECORD;
    initial_result FLOAT;
    final_result FLOAT;
    division_difference FLOAT;
BEGIN
    FOR reward IN
        SELECT * FROM rewards WHERE task_id = p_task_id
    LOOP
        -- Compute initial division result before the points are added
        SELECT total_points::float / full_cycle INTO initial_result
        FROM Bars
        WHERE bar_id = reward.bar_id;

        -- Update the Bars table by adding the points to the row with the matching bar_id
        UPDATE Bars
        SET total_points = total_points + reward.points
        WHERE bar_id = reward.bar_id
        RETURNING total_points::float / full_cycle INTO final_result;

        -- Calculate the difference in division results
        division_difference := final_result - initial_result;

        -- Check if final result has increased compared to initial result
        IF division_difference > 0 THEN
            -- Loop through the number of complete cycles increased
            FOR i IN 1..floor(division_difference) LOOP
                -- Distribute amount to currencies with corresponding currency_id
                UPDATE Currencies
                SET owned = owned + Transactions.amount
                FROM Transactions
                WHERE Transactions.currency_id = Currencies.currency_id
                  AND Transactions.bar_id = reward.bar_id
                  AND Transactions.amount > 0;

                -- Distribute vouchers to update storage in items table
                UPDATE items
                SET storage = storage + Vouchers.quantity
                FROM Vouchers
                WHERE Vouchers.item_id = items.item_id
                  AND Vouchers.bar_id = reward.bar_id
                  AND Vouchers.quantity > 0;

                RAISE NOTICE 'Distributed amount % to currency_id %', (SELECT amount FROM Transactions WHERE bar_id = reward.bar_id LIMIT 1), (SELECT currency_id FROM Transactions WHERE bar_id = reward.bar_id LIMIT 1);
                RAISE NOTICE 'Updated storage for item_id %', (SELECT item_id FROM Vouchers WHERE bar_id = reward.bar_id LIMIT 1);
            END LOOP;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION public.update_bar_and_distribute_transactions(p_task_id integer) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: reborn
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO reborn;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: reborn
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: reborn
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO reborn;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: reborn
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: reborn
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO reborn;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: reborn
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user; Type: TABLE; Schema: public; Owner: reborn
--

CREATE TABLE public.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.auth_user OWNER TO reborn;

--
-- Name: auth_user_groups; Type: TABLE; Schema: public; Owner: reborn
--

CREATE TABLE public.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_user_groups OWNER TO reborn;

--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: reborn
--

ALTER TABLE public.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: reborn
--

ALTER TABLE public.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_user_permissions; Type: TABLE; Schema: public; Owner: reborn
--

CREATE TABLE public.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_user_user_permissions OWNER TO reborn;

--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: reborn
--

ALTER TABLE public.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: bars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bars (
    bar_id integer NOT NULL,
    bar_name character varying(255),
    xp_name character varying(255),
    x_axis double precision DEFAULT 0,
    y_axis double precision DEFAULT 0,
    size_vertical double precision DEFAULT 125,
    size_horizontal double precision DEFAULT 300,
    total_points integer DEFAULT 0,
    full_cycle integer DEFAULT 200 NOT NULL,
    hidden boolean DEFAULT false,
    CONSTRAINT bars_full_cycle_check CHECK ((full_cycle > 0))
);


ALTER TABLE public.bars OWNER TO postgres;

--
-- Name: bars_bar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bars_bar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bars_bar_id_seq OWNER TO postgres;

--
-- Name: bars_bar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bars_bar_id_seq OWNED BY public.bars.bar_id;


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.currencies (
    currency_id integer NOT NULL,
    currency_name character varying(100) NOT NULL,
    owned numeric(10,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.currencies OWNER TO postgres;

--
-- Name: currencies_currency_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.currencies_currency_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.currencies_currency_id_seq OWNER TO postgres;

--
-- Name: currencies_currency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.currencies_currency_id_seq OWNED BY public.currencies.currency_id;


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: reborn
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO reborn;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: reborn
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: reborn
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO reborn;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: reborn
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: reborn
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO reborn;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: reborn
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: reborn
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO reborn;

--
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    item_id integer NOT NULL,
    item_name character varying(255) NOT NULL,
    storage integer DEFAULT 0 NOT NULL,
    CONSTRAINT items_storage_check CHECK ((storage >= 0))
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: items_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items_history (
    item_id integer NOT NULL,
    item_name character varying(255) NOT NULL,
    use_id integer NOT NULL,
    use_note character varying(500),
    use_date_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.items_history OWNER TO postgres;

--
-- Name: items_history_use_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_history_use_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_history_use_id_seq OWNER TO postgres;

--
-- Name: items_history_use_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_history_use_id_seq OWNED BY public.items_history.use_id;


--
-- Name: items_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_item_id_seq OWNER TO postgres;

--
-- Name: items_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_item_id_seq OWNED BY public.items.item_id;


--
-- Name: layers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.layers (
    layer_id integer NOT NULL,
    layer integer NOT NULL,
    foreign_id integer NOT NULL,
    foreign_table smallint NOT NULL,
    CONSTRAINT layers_layer_check CHECK (((layer >= 5000000) AND (layer < 6000000)))
);


ALTER TABLE public.layers OWNER TO postgres;

--
-- Name: layers_layer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.layers_layer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.layers_layer_id_seq OWNER TO postgres;

--
-- Name: layers_layer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.layers_layer_id_seq OWNED BY public.layers.layer_id;


--
-- Name: lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lists (
    list_id integer NOT NULL,
    list_name character varying(255),
    user_id integer,
    x_axis double precision,
    y_axis double precision,
    hidden boolean,
    size_vertical double precision,
    size_horizontal double precision,
    detail_view boolean DEFAULT true
);


ALTER TABLE public.lists OWNER TO postgres;

--
-- Name: prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prices (
    price_id integer NOT NULL,
    currency_id integer NOT NULL,
    item_id integer NOT NULL,
    shop_id integer NOT NULL,
    cost integer NOT NULL,
    CONSTRAINT prices_cost_check CHECK ((cost > 0))
);


ALTER TABLE public.prices OWNER TO postgres;

--
-- Name: prices_price_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prices_price_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prices_price_id_seq OWNER TO postgres;

--
-- Name: prices_price_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prices_price_id_seq OWNED BY public.prices.price_id;


--
-- Name: properties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.properties (
    task_id integer NOT NULL
);


ALTER TABLE public.properties OWNER TO postgres;

--
-- Name: rewards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rewards (
    reward_id integer NOT NULL,
    task_id integer NOT NULL,
    points integer DEFAULT 10,
    bar_id integer
);


ALTER TABLE public.rewards OWNER TO postgres;

--
-- Name: rewards_reward_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rewards_reward_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rewards_reward_id_seq OWNER TO postgres;

--
-- Name: rewards_reward_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rewards_reward_id_seq OWNED BY public.rewards.reward_id;


--
-- Name: shops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shops (
    shop_id integer NOT NULL,
    shop_name character varying(255),
    x_axis double precision DEFAULT 0 NOT NULL,
    y_axis double precision DEFAULT 0 NOT NULL,
    size_vertical double precision DEFAULT 300 NOT NULL,
    size_horizontal double precision DEFAULT 300 NOT NULL,
    hidden boolean DEFAULT false
);


ALTER TABLE public.shops OWNER TO postgres;

--
-- Name: shops_shop_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shops_shop_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shops_shop_id_seq OWNER TO postgres;

--
-- Name: shops_shop_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shops_shop_id_seq OWNED BY public.shops.shop_id;


--
-- Name: task_lists_list_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_lists_list_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_lists_list_id_seq OWNER TO postgres;

--
-- Name: task_lists_list_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_lists_list_id_seq OWNED BY public.lists.list_id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    task_id integer NOT NULL,
    list_id integer,
    task_name character varying(255) NOT NULL,
    created_date_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    nested_id integer,
    expanded boolean DEFAULT false
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks_history (
    task_id integer NOT NULL,
    list_id integer,
    task_name character varying(255),
    nested_id integer,
    created_date_time timestamp with time zone NOT NULL,
    completed_date_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    history_id integer NOT NULL
);


ALTER TABLE public.tasks_history OWNER TO postgres;

--
-- Name: tasks_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_history_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_history_history_id_seq OWNER TO postgres;

--
-- Name: tasks_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_history_history_id_seq OWNED BY public.tasks_history.history_id;


--
-- Name: tasks_task_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_task_id_seq OWNER TO postgres;

--
-- Name: tasks_task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_task_id_seq OWNED BY public.tasks.task_id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    transaction_id integer NOT NULL,
    task_id integer,
    bar_id integer,
    currency_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    CONSTRAINT check_task_or_bar_required CHECK ((((task_id IS NOT NULL) AND (bar_id IS NULL)) OR ((task_id IS NULL) AND (bar_id IS NOT NULL)))),
    CONSTRAINT transactions_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_transaction_id_seq OWNER TO postgres;

--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_transaction_id_seq OWNED BY public.transactions.transaction_id;


--
-- Name: vouchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vouchers (
    voucher_id integer NOT NULL,
    task_id integer,
    bar_id integer,
    quantity integer NOT NULL,
    item_id integer NOT NULL,
    CONSTRAINT vouchers_check CHECK (((task_id IS NOT NULL) OR (bar_id IS NOT NULL))),
    CONSTRAINT vouchers_check1 CHECK (((task_id IS NULL) OR (bar_id IS NULL))),
    CONSTRAINT vouchers_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.vouchers OWNER TO postgres;

--
-- Name: vouchers_voucher_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vouchers_voucher_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vouchers_voucher_id_seq OWNER TO postgres;

--
-- Name: vouchers_voucher_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vouchers_voucher_id_seq OWNED BY public.vouchers.voucher_id;


--
-- Name: bars bar_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bars ALTER COLUMN bar_id SET DEFAULT nextval('public.bars_bar_id_seq'::regclass);


--
-- Name: currencies currency_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currencies ALTER COLUMN currency_id SET DEFAULT nextval('public.currencies_currency_id_seq'::regclass);


--
-- Name: items item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN item_id SET DEFAULT nextval('public.items_item_id_seq'::regclass);


--
-- Name: items_history use_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items_history ALTER COLUMN use_id SET DEFAULT nextval('public.items_history_use_id_seq'::regclass);


--
-- Name: layers layer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.layers ALTER COLUMN layer_id SET DEFAULT nextval('public.layers_layer_id_seq'::regclass);


--
-- Name: lists list_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lists ALTER COLUMN list_id SET DEFAULT nextval('public.task_lists_list_id_seq'::regclass);


--
-- Name: prices price_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prices ALTER COLUMN price_id SET DEFAULT nextval('public.prices_price_id_seq'::regclass);


--
-- Name: rewards reward_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewards ALTER COLUMN reward_id SET DEFAULT nextval('public.rewards_reward_id_seq'::regclass);


--
-- Name: shops shop_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops ALTER COLUMN shop_id SET DEFAULT nextval('public.shops_shop_id_seq'::regclass);


--
-- Name: tasks task_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN task_id SET DEFAULT nextval('public.tasks_task_id_seq'::regclass);


--
-- Name: tasks_history history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks_history ALTER COLUMN history_id SET DEFAULT nextval('public.tasks_history_history_id_seq'::regclass);


--
-- Name: transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.transactions_transaction_id_seq'::regclass);


--
-- Name: vouchers voucher_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers ALTER COLUMN voucher_id SET DEFAULT nextval('public.vouchers_voucher_id_seq'::regclass);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- Name: bars bars_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bars
    ADD CONSTRAINT bars_pkey PRIMARY KEY (bar_id);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (currency_id);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: items_history items_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items_history
    ADD CONSTRAINT items_history_pkey PRIMARY KEY (use_id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (item_id);


--
-- Name: layers layers_layer_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.layers
    ADD CONSTRAINT layers_layer_key UNIQUE (layer);


--
-- Name: layers layers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.layers
    ADD CONSTRAINT layers_pkey PRIMARY KEY (layer_id);


--
-- Name: prices prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prices
    ADD CONSTRAINT prices_pkey PRIMARY KEY (price_id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (task_id);


--
-- Name: rewards rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (reward_id);


--
-- Name: shops shops_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_pkey PRIMARY KEY (shop_id);


--
-- Name: lists task_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT task_lists_pkey PRIMARY KEY (list_id);


--
-- Name: tasks_history tasks_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks_history
    ADD CONSTRAINT tasks_history_pkey PRIMARY KEY (history_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (task_id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (voucher_id);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX auth_user_groups_group_id_97559544 ON public.auth_user_groups USING btree (group_id);


--
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON public.auth_user_groups USING btree (user_id);


--
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON public.auth_user_user_permissions USING btree (permission_id);


--
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON public.auth_user_user_permissions USING btree (user_id);


--
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX auth_user_username_6821ab7c_like ON public.auth_user USING btree (username varchar_pattern_ops);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: reborn
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: idx_foreign; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_foreign ON public.layers USING btree (foreign_id, foreign_table);


--
-- Name: bars add_layer_on_bars; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER add_layer_on_bars AFTER INSERT ON public.bars FOR EACH ROW EXECUTE FUNCTION public.add_layer();


--
-- Name: shops add_layer_on_shops; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER add_layer_on_shops AFTER INSERT ON public.shops FOR EACH ROW EXECUTE FUNCTION public.add_layer();


--
-- Name: lists add_layer_on_task_lists; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER add_layer_on_task_lists AFTER INSERT ON public.lists FOR EACH ROW EXECUTE FUNCTION public.add_layer();


--
-- Name: tasks after_task_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER after_task_insert AFTER INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.create_related_entries();


--
-- Name: bars delete_layer_bar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER delete_layer_bar AFTER DELETE ON public.bars FOR EACH ROW EXECUTE FUNCTION public.delete_layer_if_referenced_bar();


--
-- Name: shops delete_layer_shop; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER delete_layer_shop AFTER DELETE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.delete_layer_if_referenced_shop();


--
-- Name: lists delete_layer_task_list; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER delete_layer_task_list AFTER DELETE ON public.lists FOR EACH ROW EXECUTE FUNCTION public.delete_layer_if_referenced_task_list();


--
-- Name: tasks delete_nested_tasks_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER delete_nested_tasks_trigger AFTER DELETE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.delete_nested_tasks();


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: reborn
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: prices fk_currency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prices
    ADD CONSTRAINT fk_currency FOREIGN KEY (currency_id) REFERENCES public.currencies(currency_id);


--
-- Name: prices fk_item; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prices
    ADD CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES public.items(item_id);


--
-- Name: prices fk_shop; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prices
    ADD CONSTRAINT fk_shop FOREIGN KEY (shop_id) REFERENCES public.shops(shop_id);


--
-- Name: tasks fk_tasks_list_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_list_id FOREIGN KEY (list_id) REFERENCES public.lists(list_id);


--
-- Name: properties properties_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(task_id) ON DELETE CASCADE;


--
-- Name: rewards rewards_bar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_bar_id_fkey FOREIGN KEY (bar_id) REFERENCES public.bars(bar_id) ON DELETE CASCADE;


--
-- Name: rewards rewards_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(task_id) ON DELETE CASCADE;


--
-- Name: lists task_lists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT task_lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_user(id);


--
-- Name: tasks tasks_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(list_id) ON DELETE CASCADE;


--
-- Name: transactions transactions_bar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_bar_id_fkey FOREIGN KEY (bar_id) REFERENCES public.bars(bar_id) ON DELETE CASCADE;


--
-- Name: transactions transactions_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(currency_id) ON DELETE CASCADE;


--
-- Name: transactions transactions_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(task_id) ON DELETE CASCADE;


--
-- Name: vouchers vouchers_bar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_bar_id_fkey FOREIGN KEY (bar_id) REFERENCES public.bars(bar_id) ON DELETE CASCADE;


--
-- Name: vouchers vouchers_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id) ON DELETE CASCADE;


--
-- Name: vouchers vouchers_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(task_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

