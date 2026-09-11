/* eslint-disable @typescript-eslint/no-empty-object-type */

import { Prisma } from "@/generated/prisma/client";

export type Barang = Prisma.BarangGetPayload<{
  include: {
    supplier: true;
    varians: true;
  };
}>;

export type Varian = Prisma.VarianBarangGetPayload<{}>;
export type Supplier = Prisma.SupplierGetPayload<{}>;
export type Unit = Prisma.UnitGetPayload<{}>;
