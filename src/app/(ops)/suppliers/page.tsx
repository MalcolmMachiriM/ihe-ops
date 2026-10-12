import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listSuppliers } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { canManageDirectory } from "@/lib/roles";

export default async function SuppliersPage() {
  const user = await requireUser();
  const suppliers = await listSuppliers();

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="IHE rarely holds stock — quotes are built from supplier prices gathered on request."
        actionLabel={user.role && canManageDirectory(user.role) ? "Add supplier" : undefined}
        actionHref="/suppliers/new"
      />
      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardHeader>
          <CardTitle>Sourcing partners</CardTitle>
          <CardDescription>Category coverage for hardware, electrical, solar and PPE.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Categories</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <Link href={`/suppliers/${supplier.id}`} className="font-medium hover:underline">
                      {supplier.name}
                    </Link>
                  </TableCell>
                  <TableCell>{supplier.contactPerson}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.categories}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
