
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

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE SCHEMA IF NOT EXISTS "users";

ALTER SCHEMA "users" OWNER TO "postgres";

CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "public";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."user_type" AS ENUM (
    'student',
    'client',
    'admin',
    'tutor',
    'coordinator'
);

ALTER TYPE "public"."user_type" OWNER TO "postgres";

COMMENT ON TYPE "public"."user_type" IS 'the user roles';

CREATE OR REPLACE FUNCTION "public"."fetch_group_preferences"() RETURNS TABLE("group_id" integer, "group_ratings" "json", "preferred_projects" "json")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.group_id,
        g.group_ratings::json, -- Cast group_ratings to json if it's jsonb
        json_agg(
            json_build_object(
                'project_id', gp.project_id,
                'preference_rank', gp.preference_rank
            )
        )::json AS preferred_projects -- Ensure the aggregated result is cast to json
    FROM
        groups g
    JOIN
        group_preferences gp ON g.group_id = gp.group_id
    GROUP BY
        g.group_id, g.group_ratings
    ORDER BY
        g.group_id;
END;
$$;

ALTER FUNCTION "public"."fetch_group_preferences"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."fetch_unallocated"() RETURNS TABLE("group_id" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT g.group_id
    FROM groups g
    LEFT JOIN allocations a ON g.group_id = a.group_id
    WHERE a.group_id IS NULL;
END;
$$;

ALTER FUNCTION "public"."fetch_unallocated"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_new_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    role_table TEXT;
BEGIN
    role_table := 'public.' || coalesce(new.role) || 's';
    
    EXECUTE 'INSERT INTO ' || role_table || ' (user_id) VALUES ($1)' USING new.auth_id;
    
    RETURN new;
END;
$_$;

ALTER FUNCTION "public"."handle_new_role"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.users (auth_id, email, first_name, last_name, zid, class, tutorial, role)
  values (
    new.id,  -- auth_id will be the same as the id in auth.users
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'zid',
    new.raw_user_meta_data ->> 'class',
    new.raw_user_meta_data ->> 'tutorial',
    new.raw_user_meta_data ->> 'role'
  );

  return new;
end;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."invoke_category_score_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM http_get('https://uneianihxkuzylwhvfdp.supabase.co/functions/v1/individual-rating-system?studentId=' || NEW.student_id::text);
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."invoke_category_score_update"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."invoke_category_score_update"("student_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM http_get('https://uneianihxkuzylwhvfdp.supabase.co/functions/v1/individual-rating-system?studentId=' || student_id::text);
END;
$$;

ALTER FUNCTION "public"."invoke_category_score_update"("student_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."invoke_edge_function"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  response json;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    response := http_post('https://uneianihxkuzylwhvfdp.supabase.co/functions/v1/individual-rating-system', 
                           json_build_object('user_id', NEW.user_id::text));
    -- Optionally handle the response
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."invoke_edge_function"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."invoke_edge_function"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  response json;
BEGIN
  -- Make HTTP request to Edge Function
  response := http_post('https://uneianihxkuzylwhvfdp.supabase.co/functions/v1/individual-rating-system', json_build_object('user_id', user_id::text));
END;
$$;

ALTER FUNCTION "public"."invoke_edge_function"("user_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."invoke_my_function"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM supabase.functions.invoke('individual_rating_system', 
    json_build_object('user_id', NEW.user_id, 'transcript_data', NEW.transcript_data));
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."invoke_my_function"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."notify_edge_function"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  request_id BIGINT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    request_id := net.http_post(
      url => 'https://uneianihxkuzylwhvfdp.supabase.co/functions/v1/individual-rating-system',
      body => jsonb_build_object(
        'eventType', 'UPDATE',
        'new', jsonb_build_object(
          'user_id', NEW.user_id,
          'transcript_data', NEW.transcript_data
        ),
        'old', jsonb_build_object(
          'user_id', OLD.user_id,
          'transcript_data', OLD.transcript_data
        )
      ),
      headers => jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."notify_edge_function"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."notify_group_rating_function"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  request_id BIGINT;
  local_user_id VARCHAR;
  user_record RECORD;
  student_ratings JSONB;
  user_ratings JSONB := '[]'::jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    FOR user_record IN
      SELECT user_id
      FROM group_members
      WHERE group_id = NEW.group_id
      LIMIT 6
    LOOP
      SELECT individual_marks INTO student_ratings
      FROM students
      WHERE user_id = user_record.user_id
      LIMIT 1;  -- Adjust as needed if there could be multiple ratings per user

      -- Add the user_id and student_ratings to the JSON array
      user_ratings := user_ratings || jsonb_build_object(
        'user_id', user_record.user_id,
        'student_ratings', student_ratings
      );
    END LOOP;
    request_id := net.http_post(
      url => 'https://uneianihxkuzylwhvfdp.supabase.co/functions/v1/group-rating-system',
      body => jsonb_build_object(
        'eventType', 'UPDATE',
        'new', jsonb_build_object(
          'group_id', NEW.group_id,
          'members_count', NEW.members_count,
          'user_ratings', user_ratings
        ),
        'old', jsonb_build_object(
          'group_id', OLD.group_id,
          'members_count', OLD.members_count
        )
      ),
      headers => jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."notify_group_rating_function"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_group_course"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    user_auth_id uuid;
    user_class TEXT;
    current_course TEXT;
BEGIN
    -- Get the auth_id of the user from the users table
    SELECT auth_id INTO user_auth_id FROM users WHERE auth_id = NEW.user_id;

    -- Get the class of the user from the users table using auth_id
    SELECT class INTO user_class FROM users WHERE auth_id = user_auth_id;

    -- Get the current course of the group
    SELECT course INTO current_course FROM groups WHERE group_id = NEW.group_id;

    -- Determine action based on the existing course
    IF current_course IS NULL OR current_course = user_class THEN
        -- If no course is set, or it's the same, update/set it to the user's class
        UPDATE groups SET course = user_class WHERE group_id = NEW.group_id;
    ELSIF current_course != user_class THEN
        -- If there's a conflict (different non-null course), set to 'CONFLICT'
        UPDATE groups SET course = 'CONFLICT' WHERE group_id = NEW.group_id;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_group_course"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_group_course_on_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    remaining_class TEXT;
    class_count INTEGER;
BEGIN
    -- Check if there are remaining members and count distinct classes
    SELECT COUNT(DISTINCT class) INTO class_count
    FROM users
    JOIN group_members ON users.auth_id = group_members.user_id
    WHERE group_members.group_id = OLD.group_id;

    -- Determine the action based on distinct class count
    IF class_count = 1 THEN
        -- All remaining members have the same class, fetch it
        SELECT DISTINCT class INTO remaining_class
        FROM users
        JOIN group_members ON users.auth_id = group_members.user_id
        WHERE group_members.group_id = OLD.group_id;

        -- Update course to the only remaining class
        UPDATE groups
        SET course = remaining_class
        WHERE group_id = OLD.group_id;
    ELSIF class_count > 1 THEN
        -- Conflicting classes found, set course to 'CONFLICT'
        UPDATE groups
        SET course = 'CONFLICT'
        WHERE group_id = OLD.group_id;
    ELSE
        -- No remaining members, set course to NULL or a default value
        UPDATE groups
        SET course = NULL
        WHERE group_id = OLD.group_id;
    END IF;

    RETURN OLD;
END;
$$;

ALTER FUNCTION "public"."update_group_course_on_delete"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_group_members_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groups SET members_count = members_count + 1 WHERE group_id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE groups SET members_count = members_count - 1 WHERE group_id = OLD.group_id;
    END IF;
    RETURN NULL; -- Triggers return null
END;
$$;

ALTER FUNCTION "public"."update_group_members_count"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_group_project_details"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF (NEW.project_id IS NOT NULL) THEN
        UPDATE groups
        SET client_id = proj.client_id,
            project_number = proj.project_number
        FROM (SELECT client_id, project_number FROM projects WHERE project_id = NEW.project_id) AS proj
        WHERE groups.group_id = NEW.group_id;
    END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_group_project_details"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_group_tutorial"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    user_auth_id uuid;
    user_tute TEXT;
    current_tute TEXT;
BEGIN
    -- Get the auth_id of the user from the users table
    SELECT auth_id INTO user_auth_id FROM users WHERE auth_id = NEW.user_id;

    -- Get the class of the user from the users table using auth_id
    SELECT tutorial INTO user_tute FROM users WHERE auth_id = user_auth_id;

    -- Get the current course of the group
    SELECT tutorial INTO current_tute FROM groups WHERE group_id = NEW.group_id;

    -- Determine action based on the existing course
    IF current_tute IS NULL OR current_tute = user_tute THEN
        -- If no course is set, or it's the same, update/set it to the user's class
        UPDATE groups SET tutorial = user_tute WHERE group_id = NEW.group_id;
    ELSIF current_tute != user_tute THEN
        -- If there's a conflict (different non-null course), set to 'CONFLICT'
        UPDATE groups SET tutorial = 'CONFLICT' WHERE group_id = NEW.group_id;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_group_tutorial"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_group_tutorial_on_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    remaining_tutorial TEXT;
    tutorial_count INTEGER;
BEGIN
    -- Check if there are remaining members and count distinct tutoriales
    SELECT COUNT(DISTINCT tutorial) INTO tutorial_count
    FROM users
    JOIN group_members ON users.auth_id = group_members.user_id
    WHERE group_members.group_id = OLD.group_id;

    -- Determine the action based on distinct tutorial count
    IF tutorial_count = 1 THEN
        -- All remaining members have the same tutorial, fetch it
        SELECT DISTINCT tutorial INTO remaining_tutorial
        FROM users
        JOIN group_members ON users.auth_id = group_members.user_id
        WHERE group_members.group_id = OLD.group_id;

        -- Update tutorial to the only remaining tutorial
        UPDATE groups
        SET tutorial = remaining_tutorial
        WHERE group_id = OLD.group_id;
    ELSIF tutorial_count > 1 THEN
        -- Conflicting tutoriales found, set tutorial to 'CONFLICT'
        UPDATE groups
        SET tutorial = 'CONFLICT'
        WHERE group_id = OLD.group_id;
    ELSE
        -- No remaining members, set tutorial to NULL or a default value
        UPDATE groups
        SET tutorial = NULL
        WHERE group_id = OLD.group_id;
    END IF;

    RETURN OLD;
END;
$$;

ALTER FUNCTION "public"."update_group_tutorial_on_delete"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."admins" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);

ALTER TABLE "public"."admins" OWNER TO "postgres";

COMMENT ON TABLE "public"."admins" IS 'admin roles';

CREATE TABLE IF NOT EXISTS "public"."allocation_status" (
    "boolean" boolean DEFAULT false NOT NULL,
    "last_run" timestamp with time zone
);

ALTER TABLE "public"."allocation_status" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."allocations" (
    "group_id" integer NOT NULL,
    "project_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

ALTER TABLE "public"."allocations" OWNER TO "postgres";

COMMENT ON TABLE "public"."allocations" IS 'groups to project allocation';

ALTER TABLE "public"."allocations" ALTER COLUMN "group_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."allocations_group_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."class_data" (
    "course_code" "text" DEFAULT '''''::text'::"text" NOT NULL,
    "tutorial_code" "text" DEFAULT '''''::text'::"text" NOT NULL
);

ALTER TABLE "public"."class_data" OWNER TO "postgres";

COMMENT ON TABLE "public"."class_data" IS 'CourseCode, TutorialCode';

CREATE TABLE IF NOT EXISTS "public"."clients" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);

ALTER TABLE "public"."clients" OWNER TO "postgres";

COMMENT ON TABLE "public"."clients" IS 'project clients';

CREATE TABLE IF NOT EXISTS "public"."coordinators" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);

ALTER TABLE "public"."coordinators" OWNER TO "postgres";

COMMENT ON TABLE "public"."coordinators" IS 'coordinator roles';

CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "group_id" integer NOT NULL
);

ALTER TABLE "public"."group_members" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."group_preferences" (
    "group_id" integer NOT NULL,
    "project_id" "uuid" NOT NULL,
    "preference_rank" integer DEFAULT 0 NOT NULL
);

ALTER TABLE "public"."group_preferences" OWNER TO "postgres";

COMMENT ON TABLE "public"."group_preferences" IS 'Store up to 7 Preferences for Group';

ALTER TABLE "public"."group_preferences" ALTER COLUMN "group_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."group_preferences_group_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."groups" (
    "group_id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "capacity" smallint DEFAULT '6'::smallint NOT NULL,
    "members_count" integer DEFAULT 0 NOT NULL,
    "client_id" "uuid",
    "project_number" integer,
    "group_ratings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "course" "text",
    "tutorial" "text"
);

ALTER TABLE "public"."groups" OWNER TO "postgres";

COMMENT ON COLUMN "public"."groups"."course" IS 'course the creator of the group belongs to';

COMMENT ON COLUMN "public"."groups"."tutorial" IS 'the tutorial the creator of the group belongs to';

ALTER TABLE "public"."groups" ALTER COLUMN "group_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."groups_group_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE SEQUENCE IF NOT EXISTS "public"."groups_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."groups_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."groups_id_seq" OWNED BY "public"."groups"."group_id";

CREATE TABLE IF NOT EXISTS "public"."invites" (
    "invite_id" bigint NOT NULL,
    "iss" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "role" "text" DEFAULT ''::"text" NOT NULL,
    "accepted" boolean DEFAULT false NOT NULL
);

ALTER TABLE "public"."invites" OWNER TO "postgres";

COMMENT ON TABLE "public"."invites" IS 'list of emails pending invites';

ALTER TABLE "public"."invites" ALTER COLUMN "invite_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."invites_invite_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "body" "text" NOT NULL,
    "read" boolean DEFAULT false NOT NULL,
    CONSTRAINT "notifications_body_check" CHECK (("length"("body") < 50))
);

ALTER TABLE "public"."notifications" OWNER TO "postgres";

COMMENT ON COLUMN "public"."notifications"."read" IS 'read status of notification';

CREATE TABLE IF NOT EXISTS "public"."projects" (
    "project_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "requirements_list" "text" DEFAULT ''::"text" NOT NULL,
    "technical_requirements" "text" DEFAULT ''::"text" NOT NULL,
    "client_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "project_number" bigint NOT NULL,
    "tags" "jsonb" DEFAULT '{"tags": "[]"}'::"jsonb" NOT NULL,
    "slots" bigint NOT NULL,
    CONSTRAINT "projects_slots_check" CHECK (("slots" > 0))
);

ALTER TABLE "public"."projects" OWNER TO "postgres";

COMMENT ON TABLE "public"."projects" IS 'client projects';

COMMENT ON COLUMN "public"."projects"."tags" IS 'project tags';

COMMENT ON COLUMN "public"."projects"."slots" IS 'number of slots';

ALTER TABLE "public"."projects" ALTER COLUMN "project_number" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."projects_project_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."students" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "transcript_data" "jsonb" DEFAULT '{"COMP1531": 0, "COMP1927": 0, "COMP2521": 0, "COMP3121": 0, "COMP3131": 0, "COMP3141": 0, "COMP3151": 0, "COMP3311": 0, "COMP3411": 0, "COMP4128": 0, "COMP4337": 0, "COMP4511": 0, "COMP6080": 0, "COMP6443": 0, "COMP6447": 0, "COMP6448": 0, "COMP6713": 0, "COMP6771": 0, "COMP6843": 0, "COMP9020": 0, "COMP9021": 0, "COMP9312": 0, "COMP9313": 0, "COMP9315": 0, "COMP9417": 0, "COMP9418": 0, "COMP9444": 0, "COMP9491": 0, "COMP9517": 0, "COMP9727": 0}'::"jsonb" NOT NULL,
    "individual_marks" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);

ALTER TABLE "public"."students" OWNER TO "postgres";

COMMENT ON TABLE "public"."students" IS 'students roles';

COMMENT ON COLUMN "public"."students"."transcript_data" IS 'student marks';

COMMENT ON COLUMN "public"."students"."individual_marks" IS 'processed transcript data';

CREATE TABLE IF NOT EXISTS "public"."tutors" (
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);

ALTER TABLE "public"."tutors" OWNER TO "postgres";

COMMENT ON TABLE "public"."tutors" IS 'tutor roles';

CREATE TABLE IF NOT EXISTS "public"."unallocated_groups" (
    "group_id" integer NOT NULL
);

ALTER TABLE "public"."unallocated_groups" OWNER TO "postgres";

COMMENT ON TABLE "public"."unallocated_groups" IS 'groups that have submitted their preferences that are not allocated';

ALTER TABLE "public"."unallocated_groups" ALTER COLUMN "group_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."unallocated_groups_group_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."users" (
    "auth_id" "uuid" NOT NULL,
    "img" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "first_name" "text" DEFAULT ''::"text" NOT NULL,
    "last_name" "text" DEFAULT ''::"text" NOT NULL,
    "zid" "text" DEFAULT ''::"text" NOT NULL,
    "class" "text" DEFAULT ''::"text" NOT NULL,
    "tutorial" "text" DEFAULT ''::"text" NOT NULL,
    "role" "text" DEFAULT ''::"text" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);

ALTER TABLE "public"."users" OWNER TO "postgres";

COMMENT ON TABLE "public"."users" IS 'public users table';

COMMENT ON COLUMN "public"."users"."auth_id" IS 'Once a user registers, this will be fulfilled';

COMMENT ON COLUMN "public"."users"."id" IS 'unique public id';

ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."allocation_status"
    ADD CONSTRAINT "allocation_status_pkey" PRIMARY KEY ("boolean");

ALTER TABLE ONLY "public"."allocations"
    ADD CONSTRAINT "allocations_pkey" PRIMARY KEY ("group_id");

ALTER TABLE ONLY "public"."class_data"
    ADD CONSTRAINT "class_data_pkey" PRIMARY KEY ("course_code", "tutorial_code");

ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."coordinators"
    ADD CONSTRAINT "coordinators_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."group_preferences"
    ADD CONSTRAINT "group_preferences_pkey" PRIMARY KEY ("group_id", "project_id");

ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_id_key" UNIQUE ("group_id");

ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("group_id");

ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_invite_id_key" UNIQUE ("invite_id");

ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_pkey" PRIMARY KEY ("invite_id");

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("project_id");

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_project_id_key" UNIQUE ("project_id");

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_project_number_key" UNIQUE ("project_number");

ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."tutors"
    ADD CONSTRAINT "tutors_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."unallocated_groups"
    ADD CONSTRAINT "unallocated_groups_pkey" PRIMARY KEY ("group_id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_id_key" UNIQUE ("auth_id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

CREATE OR REPLACE TRIGGER "test_trigger" AFTER UPDATE OF "members_count" ON "public"."groups" FOR EACH ROW WHEN (("old"."members_count" IS DISTINCT FROM "new"."members_count")) EXECUTE FUNCTION "public"."notify_group_rating_function"();

CREATE OR REPLACE TRIGGER "trg_on_public_user_added" AFTER INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_role"();

CREATE OR REPLACE TRIGGER "trigger_update_group_course" AFTER INSERT ON "public"."group_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_group_course"();

CREATE OR REPLACE TRIGGER "trigger_update_group_course_on_delete" AFTER DELETE ON "public"."group_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_group_course_on_delete"();

CREATE OR REPLACE TRIGGER "trigger_update_group_project_details" AFTER INSERT OR UPDATE ON "public"."allocations" FOR EACH ROW EXECUTE FUNCTION "public"."update_group_project_details"();

CREATE OR REPLACE TRIGGER "trigger_update_group_tutorial" AFTER INSERT ON "public"."group_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_group_tutorial"();

CREATE OR REPLACE TRIGGER "trigger_update_group_tutorial_on_delete" AFTER DELETE ON "public"."group_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_group_tutorial_on_delete"();

CREATE OR REPLACE TRIGGER "trigger_update_members_count_after_delete" AFTER DELETE ON "public"."group_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_group_members_count"();

CREATE OR REPLACE TRIGGER "trigger_update_members_count_after_insert" AFTER INSERT ON "public"."group_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_group_members_count"();

CREATE OR REPLACE TRIGGER "update_transcript_data_trigger" AFTER UPDATE OF "transcript_data" ON "public"."students" FOR EACH ROW WHEN (("old"."transcript_data" IS DISTINCT FROM "new"."transcript_data")) EXECUTE FUNCTION "public"."notify_edge_function"();

ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."allocations"
    ADD CONSTRAINT "allocations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("group_id");

ALTER TABLE ONLY "public"."allocations"
    ADD CONSTRAINT "allocations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id");

ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."coordinators"
    ADD CONSTRAINT "coordinators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."group_preferences"
    ADD CONSTRAINT "group_preferences_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("group_id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."group_preferences"
    ADD CONSTRAINT "group_preferences_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("user_id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_project_number_fkey" FOREIGN KEY ("project_number") REFERENCES "public"."projects"("project_number") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_iss_fkey" FOREIGN KEY ("iss") REFERENCES "public"."users"("auth_id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tutors"
    ADD CONSTRAINT "tutors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."unallocated_groups"
    ADD CONSTRAINT "unallocated_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("group_id");

ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "user_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("group_id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "user_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."students"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

CREATE POLICY "Admins can update role" ON "public"."users" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "users_1"
  WHERE (("auth"."uid"() = "users_1"."auth_id") AND ("users_1"."role" = 'admin'::"text")))));

CREATE POLICY "Allow inserts" ON "public"."allocations" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow updates" ON "public"."allocations" FOR UPDATE USING (true);

CREATE POLICY "Enable access for all users" ON "public"."notifications" USING (true);

CREATE POLICY "Enable admin to delete" ON "public"."clients" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("auth"."uid"() = "users"."auth_id") AND ("users"."role" = 'admin'::"text")))));

CREATE POLICY "Enable admin to delete" ON "public"."coordinators" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("auth"."uid"() = "users"."auth_id") AND ("users"."role" = 'admin'::"text")))));

CREATE POLICY "Enable admin to insert" ON "public"."clients" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("auth"."uid"() = "users"."auth_id") AND ("users"."role" = 'admin'::"text")))));

CREATE POLICY "Enable admin to insert" ON "public"."coordinators" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("auth"."uid"() = "users"."auth_id") AND ("users"."role" = 'admin'::"text")))));

CREATE POLICY "Enable delete" ON "public"."unallocated_groups" FOR DELETE USING (true);

CREATE POLICY "Enable delete for admins" ON "public"."students" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("auth"."uid"() = "users"."auth_id") AND ("users"."role" = 'admin'::"text")))));

CREATE POLICY "Enable delete for admins" ON "public"."tutors" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("auth"."uid"() = "users"."auth_id") AND ("users"."role" = 'admin'::"text")))));

CREATE POLICY "Enable delete for authenticated users only" ON "public"."class_data" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON "public"."invites" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "Enable delete for saved rows that have no current preference_ra" ON "public"."group_preferences" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_preferences"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));

CREATE POLICY "Enable group members to insert preferences" ON "public"."group_preferences" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_preferences"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))));

CREATE POLICY "Enable group members to update preferences" ON "public"."group_preferences" FOR UPDATE USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("group_id" IN ( SELECT "group_members"."group_id"
   FROM "public"."group_members"
  WHERE ("group_members"."user_id" = "auth"."uid"()))));

CREATE POLICY "Enable insert for admins" ON "public"."students" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("auth"."uid"() = "users"."auth_id") AND ("users"."role" = 'admin'::"text")))));

CREATE POLICY "Enable insert for admins" ON "public"."tutors" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("auth"."uid"() = "users"."auth_id") AND ("users"."role" = 'admin'::"text")))));

CREATE POLICY "Enable insert for authenticated users only" ON "public"."class_data" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."invites" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for users based on user_id" ON "public"."admins" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Enable insert for users based on user_id" ON "public"."clients" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Enable insert for users based on user_id" ON "public"."coordinators" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Enable insert for users based on user_id" ON "public"."projects" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "client_id"));

CREATE POLICY "Enable insert for users based on user_id" ON "public"."students" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Enable insert for users based on user_id" ON "public"."tutors" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Enable read access for all users" ON "public"."allocation_status" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."allocations" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."class_data" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."coordinators" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."group_preferences" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."invites" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."projects" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."students" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."tutors" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."unallocated_groups" FOR SELECT USING (true);

CREATE POLICY "Enable update for authenticated users only" ON "public"."allocation_status" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "Enable update for users based on email" ON "public"."invites" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text") = "email")) WITH CHECK (((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text") = "email"));

CREATE POLICY "Enable update for users based on user_id" ON "public"."projects" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "client_id"));

CREATE POLICY "Public profiles are viewable by everyone." ON "public"."users" FOR SELECT USING (true);

CREATE POLICY "Read on clients" ON "public"."clients" FOR SELECT USING (true);

CREATE POLICY "Users can update own profile." ON "public"."users" FOR UPDATE USING ((( SELECT "auth"."email"() AS "email") = "email"));

ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_access" ON "public"."group_members" USING (("auth"."uid"() IS NOT NULL));

ALTER TABLE "public"."allocation_status" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."allocations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."class_data" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."coordinators" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."group_preferences" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_access_to_all_groups_table" ON "public"."groups" USING (("auth"."uid"() IS NOT NULL));

ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_access_to_the_groups_table" ON "public"."groups" FOR SELECT USING (("auth"."uid"() IS NOT NULL));

ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tutors" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."unallocated_groups" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "update_the_groups_table" ON "public"."groups" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "update_user_groups" ON "public"."group_members" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."allocations";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."fetch_group_preferences"() TO "anon";
GRANT ALL ON FUNCTION "public"."fetch_group_preferences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_group_preferences"() TO "service_role";

GRANT ALL ON FUNCTION "public"."fetch_unallocated"() TO "anon";
GRANT ALL ON FUNCTION "public"."fetch_unallocated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_unallocated"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_role"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "postgres";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "anon";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "service_role";

GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "service_role";

GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "postgres";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "anon";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "service_role";

GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "service_role";

GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "postgres";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "anon";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "service_role";

GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "service_role";

GRANT ALL ON FUNCTION "public"."invoke_category_score_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."invoke_category_score_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."invoke_category_score_update"() TO "service_role";

GRANT ALL ON FUNCTION "public"."invoke_category_score_update"("student_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."invoke_category_score_update"("student_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invoke_category_score_update"("student_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."invoke_edge_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."invoke_edge_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."invoke_edge_function"() TO "service_role";

GRANT ALL ON FUNCTION "public"."invoke_edge_function"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."invoke_edge_function"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invoke_edge_function"("user_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."invoke_my_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."invoke_my_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."invoke_my_function"() TO "service_role";

GRANT ALL ON FUNCTION "public"."notify_edge_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_edge_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_edge_function"() TO "service_role";

GRANT ALL ON FUNCTION "public"."notify_group_rating_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_group_rating_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_group_rating_function"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_group_course"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_group_course"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_group_course"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_group_course_on_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_group_course_on_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_group_course_on_delete"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_group_members_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_group_members_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_group_members_count"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_group_project_details"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_group_project_details"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_group_project_details"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_group_tutorial"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_group_tutorial"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_group_tutorial"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_group_tutorial_on_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_group_tutorial_on_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_group_tutorial_on_delete"() TO "service_role";

GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "service_role";

GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "service_role";

GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "service_role";

GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";

GRANT ALL ON TABLE "public"."allocation_status" TO "anon";
GRANT ALL ON TABLE "public"."allocation_status" TO "authenticated";
GRANT ALL ON TABLE "public"."allocation_status" TO "service_role";

GRANT ALL ON TABLE "public"."allocations" TO "anon";
GRANT ALL ON TABLE "public"."allocations" TO "authenticated";
GRANT ALL ON TABLE "public"."allocations" TO "service_role";

GRANT ALL ON SEQUENCE "public"."allocations_group_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."allocations_group_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."allocations_group_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."class_data" TO "anon";
GRANT ALL ON TABLE "public"."class_data" TO "authenticated";
GRANT ALL ON TABLE "public"."class_data" TO "service_role";

GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";

GRANT ALL ON TABLE "public"."coordinators" TO "anon";
GRANT ALL ON TABLE "public"."coordinators" TO "authenticated";
GRANT ALL ON TABLE "public"."coordinators" TO "service_role";

GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";

GRANT ALL ON TABLE "public"."group_preferences" TO "anon";
GRANT ALL ON TABLE "public"."group_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."group_preferences" TO "service_role";

GRANT ALL ON SEQUENCE "public"."group_preferences_group_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."group_preferences_group_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."group_preferences_group_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";

GRANT ALL ON SEQUENCE "public"."groups_group_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."groups_group_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."groups_group_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."groups_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."groups_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."groups_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."invites" TO "anon";
GRANT ALL ON TABLE "public"."invites" TO "authenticated";
GRANT ALL ON TABLE "public"."invites" TO "service_role";

GRANT ALL ON SEQUENCE "public"."invites_invite_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invites_invite_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invites_invite_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";

GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";

GRANT ALL ON SEQUENCE "public"."projects_project_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."projects_project_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."projects_project_number_seq" TO "service_role";

GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";

GRANT ALL ON TABLE "public"."tutors" TO "anon";
GRANT ALL ON TABLE "public"."tutors" TO "authenticated";
GRANT ALL ON TABLE "public"."tutors" TO "service_role";

GRANT ALL ON TABLE "public"."unallocated_groups" TO "anon";
GRANT ALL ON TABLE "public"."unallocated_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."unallocated_groups" TO "service_role";

GRANT ALL ON SEQUENCE "public"."unallocated_groups_group_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."unallocated_groups_group_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."unallocated_groups_group_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
