import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useApiData, User } from "@/hooks/useApiData";
import { Plus, Pencil, Trash2, Shield, User as UserIcon } from "lucide-react";

const Users: React.FC = () => {
    const { getUsers, createUser, updateUser, deleteUser } = useApiData();
    const [users, setUsers] = useState<User[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const initialFormState: User = { name: '', email: '', role: 'operador', password: '' };
    const [formData, setFormData] = useState<User>(initialFormState);

    const loadData = async () => {
        const data = await getUsers();
        setUsers(data);
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async () => {
        if (editingUser && editingUser.id) {
            await updateUser(editingUser.id, formData);
        } else {
            await createUser(formData);
        }
        setIsDialogOpen(false);
        setEditingUser(null);
        setFormData(initialFormState);
        loadData();
    };

    const handleEdit = (u: User) => {
        setEditingUser(u);
        setFormData({ ...u, password: '' });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if(confirm("¿Eliminar usuario?")) {
            await deleteUser(id);
            loadData();
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Usuarios del Sistema</h1>
                        <p className="text-muted-foreground">Administración de cuentas y permisos.</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if(!open) { setEditingUser(null); setFormData(initialFormState); } }}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Usuario</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingUser ? 'Editar' : 'Nuevo'} Usuario</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Rol</Label>
                                    <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="supervisor">Supervisor</SelectItem>
                                            <SelectItem value="operador">Operador Logístico</SelectItem>
                                            <SelectItem value="heladero">Heladero</SelectItem>
                                            <SelectItem value="cliente">Cliente Regular</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</Label>
                                    <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit}>Guardar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                <UserIcon className="h-4 w-4 text-slate-500" />
                                            </div>
                                            {u.name}
                                        </TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {u.role?.replace('ROLE_', '').replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(u)}><Pencil className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => u.id && handleDelete(u.id)}><Trash2 className="h-4 w-4"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Users;