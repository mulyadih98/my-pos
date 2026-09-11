import { db } from "./src/lib/db";

async function check() {
  console.log("Keys in db:", Object.keys(db));
  console.log("db.member:", db.member);
}

check();
