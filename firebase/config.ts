// firebase/config.ts
import { Platform } from "react-native";
import * as native from "./config.native";
import * as web from "./config.web";

const cfg = Platform.OS === "web" ? web : native;

export const app  = cfg.app;
export const auth = cfg.auth;
export const db   = cfg.db;
