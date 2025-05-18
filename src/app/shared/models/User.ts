import { Insurance } from "./Insurance";

export interface User {
  id: string;
  name: {
    firstname: string;
    lastname: string;
  };
  email: string;
  insurances: Insurance[];
  expired_insurances: Insurance[];
}