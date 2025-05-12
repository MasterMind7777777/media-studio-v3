
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Search, Filter, MoreHorizontal } from "lucide-react";

export default function AdminContentPacks() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Pack Management</h1>
          <p className="text-muted-foreground">
            Create and manage content packs and assets.
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Content Pack
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search content packs..." 
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filter</span>
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Assets</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* This would be mapped from actual data */}
            {Array.from({length: 5}).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">PACK-{1000+i}</TableCell>
                <TableCell>Content Pack {i+1}</TableCell>
                <TableCell>{i % 2 === 0 ? 'Photos' : 'Graphics'}</TableCell>
                <TableCell className="text-center">
                  {(i+1) * 5}
                </TableCell>
                <TableCell className="text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${i % 3 === 0 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {i % 3 === 0 ? 'Active' : 'Draft'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
