export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          user_id: string;
        };
        Insert: {
          user_id?: string;
        };
        Update: {
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admins_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      allocation_status: {
        Row: {
          boolean: boolean;
          last_run: string | null;
        };
        Insert: {
          boolean?: boolean;
          last_run?: string | null;
        };
        Update: {
          boolean?: boolean;
          last_run?: string | null;
        };
        Relationships: [];
      };
      allocations: {
        Row: {
          group_id: number;
          project_id: string;
        };
        Insert: {
          group_id?: number;
          project_id?: string;
        };
        Update: {
          group_id?: number;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'allocations_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: true;
            referencedRelation: 'groups';
            referencedColumns: ['group_id'];
          },
          {
            foreignKeyName: 'allocations_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['project_id'];
          },
        ];
      };
      class_data: {
        Row: {
          course_code: string;
          tutorial_code: string;
        };
        Insert: {
          course_code?: string;
          tutorial_code?: string;
        };
        Update: {
          course_code?: string;
          tutorial_code?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          user_id: string;
        };
        Insert: {
          user_id?: string;
        };
        Update: {
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clients_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      coordinators: {
        Row: {
          user_id: string;
        };
        Insert: {
          user_id?: string;
        };
        Update: {
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'coordinators_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: number;
          user_id: string;
        };
        Insert: {
          group_id: number;
          user_id?: string;
        };
        Update: {
          group_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_groups_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['group_id'];
          },
          {
            foreignKeyName: 'user_groups_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'students';
            referencedColumns: ['user_id'];
          },
        ];
      };
      group_preferences: {
        Row: {
          group_id: number;
          preference_rank: number;
          project_id: string;
        };
        Insert: {
          group_id?: number;
          preference_rank?: number;
          project_id: string;
        };
        Update: {
          group_id?: number;
          preference_rank?: number;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_preferences_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['group_id'];
          },
          {
            foreignKeyName: 'group_preferences_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['project_id'];
          },
        ];
      };
      groups: {
        Row: {
          capacity: number;
          client_id: string | null;
          course: string | null;
          description: string;
          group_id: number;
          group_ratings: Json;
          members_count: number;
          name: string;
          project_number: number | null;
          tutorial: string | null;
        };
        Insert: {
          capacity?: number;
          client_id?: string | null;
          course?: string | null;
          description: string;
          group_id?: number;
          group_ratings?: Json;
          members_count?: number;
          name: string;
          project_number?: number | null;
          tutorial?: string | null;
        };
        Update: {
          capacity?: number;
          client_id?: string | null;
          course?: string | null;
          description?: string;
          group_id?: number;
          group_ratings?: Json;
          members_count?: number;
          name?: string;
          project_number?: number | null;
          tutorial?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'groups_project_number_fkey';
            columns: ['project_number'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['project_number'];
          },
        ];
      };
      invites: {
        Row: {
          accepted: boolean;
          email: string;
          invite_id: number;
          iss: string;
          role: string;
        };
        Insert: {
          accepted?: boolean;
          email?: string;
          invite_id?: number;
          iss?: string;
          role?: string;
        };
        Update: {
          accepted?: boolean;
          email?: string;
          invite_id?: number;
          iss?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invites_iss_fkey';
            columns: ['iss'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['auth_id'];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          read: boolean;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          read?: boolean;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          read?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          client_id: string;
          description: string;
          project_id: string;
          project_number: number;
          requirements_list: string;
          slots: number;
          tags: Json;
          technical_requirements: string;
          title: string;
        };
        Insert: {
          client_id?: string;
          description?: string;
          project_id?: string;
          project_number?: number;
          requirements_list?: string;
          slots: number;
          tags?: Json;
          technical_requirements?: string;
          title?: string;
        };
        Update: {
          client_id?: string;
          description?: string;
          project_id?: string;
          project_number?: number;
          requirements_list?: string;
          slots?: number;
          tags?: Json;
          technical_requirements?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['user_id'];
          },
        ];
      };
      students: {
        Row: {
          individual_marks: Json;
          transcript_data: Json;
          user_id: string;
        };
        Insert: {
          individual_marks?: Json;
          transcript_data?: Json;
          user_id?: string;
        };
        Update: {
          individual_marks?: Json;
          transcript_data?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'students_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      tutors: {
        Row: {
          user_id: string;
        };
        Insert: {
          user_id?: string;
        };
        Update: {
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tutors_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      unallocated_groups: {
        Row: {
          group_id: number;
        };
        Insert: {
          group_id?: number;
        };
        Update: {
          group_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'unallocated_groups_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: true;
            referencedRelation: 'groups';
            referencedColumns: ['group_id'];
          },
        ];
      };
      users: {
        Row: {
          auth_id: string;
          class: string;
          email: string;
          first_name: string;
          id: string;
          img: string;
          last_name: string;
          role: string;
          tutorial: string;
          zid: string;
        };
        Insert: {
          auth_id: string;
          class?: string;
          email?: string;
          first_name?: string;
          id?: string;
          img?: string;
          last_name?: string;
          role?: string;
          tutorial?: string;
          zid?: string;
        };
        Update: {
          auth_id?: string;
          class?: string;
          email?: string;
          first_name?: string;
          id?: string;
          img?: string;
          last_name?: string;
          role?: string;
          tutorial?: string;
          zid?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_auth_id_fkey';
            columns: ['auth_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      fetch_group_preferences: {
        Args: Record<PropertyKey, never>;
        Returns: {
          group_id: number;
          group_ratings: Json;
          preferred_projects: Json;
        }[];
      };
      fetch_unallocated: {
        Args: Record<PropertyKey, never>;
        Returns: {
          group_id: number;
        }[];
      };
      http: {
        Args: {
          request: Database['public']['CompositeTypes']['http_request'];
        };
        Returns: unknown;
      };
      http_delete:
        | {
            Args: {
              uri: string;
            };
            Returns: unknown;
          }
        | {
            Args: {
              uri: string;
              content: string;
              content_type: string;
            };
            Returns: unknown;
          };
      http_get:
        | {
            Args: {
              uri: string;
            };
            Returns: unknown;
          }
        | {
            Args: {
              uri: string;
              data: Json;
            };
            Returns: unknown;
          };
      http_head: {
        Args: {
          uri: string;
        };
        Returns: unknown;
      };
      http_header: {
        Args: {
          field: string;
          value: string;
        };
        Returns: Database['public']['CompositeTypes']['http_header'];
      };
      http_list_curlopt: {
        Args: Record<PropertyKey, never>;
        Returns: {
          curlopt: string;
          value: string;
        }[];
      };
      http_patch: {
        Args: {
          uri: string;
          content: string;
          content_type: string;
        };
        Returns: unknown;
      };
      http_post:
        | {
            Args: {
              uri: string;
              content: string;
              content_type: string;
            };
            Returns: unknown;
          }
        | {
            Args: {
              uri: string;
              data: Json;
            };
            Returns: unknown;
          };
      http_put: {
        Args: {
          uri: string;
          content: string;
          content_type: string;
        };
        Returns: unknown;
      };
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      http_set_curlopt: {
        Args: {
          curlopt: string;
          value: string;
        };
        Returns: boolean;
      };
      invoke_category_score_update: {
        Args: {
          student_id: string;
        };
        Returns: undefined;
      };
      invoke_edge_function: {
        Args: {
          user_id: string;
        };
        Returns: undefined;
      };
      urlencode:
        | {
            Args: {
              data: Json;
            };
            Returns: string;
          }
        | {
            Args: {
              string: string;
            };
            Returns: string;
          }
        | {
            Args: {
              string: string;
            };
            Returns: string;
          };
    };
    Enums: {
      user_type: 'student' | 'client' | 'admin' | 'tutor' | 'coordinator';
    };
    CompositeTypes: {
      http_header: {
        field: string | null;
        value: string | null;
      };
      http_request: {
        method: unknown | null;
        uri: string | null;
        headers: Database['public']['CompositeTypes']['http_header'][] | null;
        content_type: string | null;
        content: string | null;
      };
      http_response: {
        status: number | null;
        content_type: string | null;
        headers: Database['public']['CompositeTypes']['http_header'][] | null;
        content: string | null;
      };
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views']) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;
