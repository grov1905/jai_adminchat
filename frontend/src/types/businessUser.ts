import { Business } from "./business";
import { Role } from "./role";

export interface BusinessUser {
    id: string;
    email: string;
    full_name: string;
    business: Business | null;
    role: Role;
    is_active: boolean;
    date_joined: string;
    last_login: string | null;
    phone: string;
    profile_picture: string | null;
  }


