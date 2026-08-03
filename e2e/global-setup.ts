import { resetAndMigrateTestDb } from "./db-path";

export default function globalSetup() {
  resetAndMigrateTestDb();
}
