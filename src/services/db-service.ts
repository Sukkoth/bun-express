import { db } from '@libs/db';
import { SQL, sql } from 'bun';

export async function getById<T>(id: string | number) {
  const result = await db<T[]>`SELECT * FROM users WHERE id = ${id}`;
  return result[0];
}

export async function getByField<T>(
  table: string,
  field: string,
  value: unknown,
) {
  const result = await db<
    T[]
  >`SELECT * FROM ${sql(table)} WHERE ${sql(field)} = ${value}`;
  return result;
}

export async function insert<T>(table: string, data: Partial<T>) {
  const result = await db<
    T[]
  >`INSERT INTO ${sql(table)} ${sql(data)} RETURNING *`;

  return result[0];
}

export async function update<T>(
  table: string,
  id: string | number,
  data: Partial<T>,
) {
  const result = await db<
    T[]
  >`UPDATE ${sql(table)} SET ${sql(data)} WHERE id = ${id} RETURNING *`;

  return result[0];
}

export async function remove<T>(table: string, id: string | number) {
  const result = await db<
    T[]
  >`DELETE FROM ${sql(table)} WHERE id = ${id} RETURNING *`;

  return result[0];
}

export async function raw<T>(query: SQL.Query<T>) {
  const result = await db<T[]>`${query}`;
  return result;
}
