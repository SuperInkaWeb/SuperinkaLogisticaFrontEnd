import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useApiData, User, Company } from "@/hooks/useApiData"; // Importamos Company
import { useToast } from "@/hooks/use-toast";
import { Search, User as UserIcon, Shield, Trash2, Edit, Plus, UserCog, Briefcase, Eye, EyeOff, Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/frontend/context/AuthContext"; // Para saber si soy Super Admin

const Users: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { getUsers, createUser, updateUser, deleteUser, getCompanies } = useApiData();
    const { toast } = useToast();

    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]); // Estado para empresas
    const [loading, setLoading] = useState(true);

    // Filtro
    const [searchTerm, setSearchTerm] = useState("");

    // Modales
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Estado para Edición/Creación
    const [formData, setFormData] = useState<Partial<User>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Verificar si soy Super Admin
    const isSuperAdmin = currentUser?.role?.toLowerCase().includes('super');

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargamos usuarios y empresas en paralelo si es necesario
            // Corrección de tipo para evitar 'any'
            const promises: Promise<User[] | Company[]>[] = [getUsers()];
            if (isSuperAdmin) {
                promises.push(getCompanies());
            }

            const [usersData, companiesData] = await Promise.all(promises);

            // Asignación segura con verificación de tipo (type guard simple)
            setUsers(Array.isArray(usersData) ? (usersData as User[]) : []);

            // Si companiesData existe (fue la segunda promesa), lo asignamos
            if (companiesData && Array.isArray(companiesData)) {
                setCompanies(companiesData as Company[]);
            }

        } catch (error) {
            console.error("Error cargando datos", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentUser]); // Recargar si cambia el usuario

    // --- FILTRADO ---
    const filteredUsers = users.filter(user => {
        const search = searchTerm.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(search);
        const emailMatch = user.email?.toLowerCase().includes(search);
        const companyMatch = user.companyName?.toLowerCase().includes(search); // Buscar también por empresa
        return nameMatch || emailMatch || companyMatch;
    });

    // --- HANDLERS DEL CRUD ---

    const handleCreate = () => {
        setFormData({ name: "", email: "", role: "operador", password: "", companyId: "" });
        setIsEditing(false);
        setIsFormOpen(true);
        setShowPassword(false);
    };

    const handleEdit = (user: User) => {
        // CORRECCIÓN: Usar const en lugar de let
        const currentRole = user.role?.toLowerCase().replace('role_', '') || 'operador';

        // Al editar, la contraseña empieza vacía
        // Mantenemos el companyId existente
        setFormData({ ...user, role: currentRole, password: "" });
        setIsEditing(true);
        setIsFormOpen(true);
        setShowPassword(false);
    };

    const handleDeleteClick = (user: User) => {
        setFormData(user);
        setIsDeleteOpen(true);
    };

    const saveUser = async () => {
        // Validación básica
        if (!formData.name || !formData.email) {
            toast({ variant: "destructive", title: "Error", description: "Nombre y Email son obligatorios." });
            return;
        }

        if (!isEditing && !formData.password) {
            toast({ variant: "destructive", title: "Error", description: "La contraseña es obligatoria para nuevos usuarios." });
            return;
        }

        // Validación de Empresa para Super Admin
        if (isSuperAdmin && !formData.companyId && formData.role !== 'super_admin' && !isEditing) {
            // Opcional: Podrías permitir crear sin empresa (global), pero para Admin de empresa es obligatorio
            if (formData.role === 'admin') {
                toast({ variant: "destructive", title: "Error", description: "Debes asignar una empresa al Administrador." });
                return;
            }
        }

        try {
            if (isEditing) {
                const userToUpdate = { ...formData };
                if (!userToUpdate.password) {
                    delete userToUpdate.password;
                }

                if (formData.id) {
                    await updateUser(formData.id, userToUpdate as User);
                    loadData(); // Recargar para ver cambios (ej. empresa actualizada)
                    toast({ title: "Usuario Actualizado", description: `Datos guardados.` });
                }
            } else {
                await createUser(formData as User);
                loadData();
                toast({ title: "Usuario Creado", description: `Bienvenido ${formData.name}` });
            }
            setIsFormOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const confirmDelete = async () => {
        if (!formData.id) return;
        try {
            const success = await deleteUser(formData.id);
            if (success) {
                setUsers(prev => prev.filter(u => u.id !== formData.id));
                toast({ title: "Usuario Eliminado", description: "Cuenta removida del sistema." });
                setIsDeleteOpen(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getRoleBadge = (role: string = '') => {
        const normalizedRole = role.toLowerCase().replace('role_', '');
        switch (normalizedRole) {
            case 'admin':
            case 'super_admin':
                return <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"><Shield className="w-3 h-3 mr-1"/> Admin</Badge>;
            case 'supervisor':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"><UserCog className="w-3 h-3 mr-1"/> Supervisor</Badge>;
            case 'operador':
                return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"><Briefcase className="w-3 h-3 mr-1"/> Operador</Badge>;
            case 'cliente':
                return <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 hover:bg-green-100">Cliente</Badge>;
            default:
                return <Badge variant="secondary"><UserIcon className="w-3 h-3 mr-1"/> {normalizedRole}</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">

                {/* CABECERA */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Gestión de Usuarios</h1>
                        <p className="text-muted-foreground">Administración de accesos y roles del sistema.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar usuario..."
                                className="pl-9 w-full md:w-[250px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
                            <Plus className="w-4 h-4 mr-2"/> Nuevo Usuario
                        </Button>
                    </div>
                </div>

                {/* TABLA DE USUARIOS */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Usuarios Registrados</CardTitle>
                        <CardDescription>
                            {filteredUsers.length} registros encontrados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Rol</TableHead>
                                        {/* Columna extra para Empresa si es Super Admin */}
                                        {isSuperAdmin && <TableHead>Empresa</TableHead>}
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isSuperAdmin ? 6 : 5} className="text-center h-24 text-muted-foreground">
                                                No se encontraron usuarios.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                            <span className="font-semibold text-xs text-slate-500">{user.name?.substring(0,2).toUpperCase()}</span>
                                                        </div>
                                                        <span className="font-medium">{user.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    {getRoleBadge(user.role)}
                                                </TableCell>
                                                {/* Mostrar Empresa */}
                                                {isSuperAdmin && (
                                                    <TableCell>
                                                        {user.companyName ? (
                                                            <div className="flex items-center gap-1 text-sm text-slate-600">
                                                                <Building2 className="w-3 h-3"/> {user.companyName}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">Global</span>
                                                        )}
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    {user.enabled !== false ?
                                                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 text-[10px]">Activo</Badge> :
                                                        <Badge variant="outline" className="text-slate-500 bg-slate-50 text-[10px]">Inactivo</Badge>
                                                    }
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} title="Editar">
                                                            <Edit className="h-4 w-4 text-slate-500 hover:text-blue-600"/>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)} title="Eliminar">
                                                            <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600"/>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* MODAL CREAR/EDITAR */}
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                            <DialogDescription>
                                Complete los datos de acceso del usuario.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* Campos Básicos */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input
                                    id="name"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password">
                                        {isEditing ? 'Contraseña (Opcional)' : 'Contraseña'}
                                    </Label>
                                    {isEditing && <span className="text-xs text-muted-foreground">Dejar en blanco para no cambiar</span>}
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password || ''}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        placeholder={isEditing ? "••••••" : "Ingrese contraseña"}
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground"/> : <Eye className="h-4 w-4 text-muted-foreground"/>}
                                    </Button>
                                </div>
                            </div>

                            {/* Rol */}
                            <div className="space-y-2">
                                <Label htmlFor="role">Rol del Sistema</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(val) => setFormData({...formData, role: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isSuperAdmin && <SelectItem value="super_admin">Super Admin (Global)</SelectItem>}
                                        <SelectItem value="admin">Administrador de Empresa</SelectItem>
                                        <SelectItem value="supervisor">Supervisor</SelectItem>
                                        <SelectItem value="operador">Operador</SelectItem>
                                        <SelectItem value="cliente">Cliente (Heladero)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* SELECCIÓN DE EMPRESA (Solo Super Admin) */}
                            {isSuperAdmin && formData.role !== 'super_admin' && (
                                <div className="space-y-2">
                                    <Label htmlFor="company">Empresa Asignada</Label>
                                    <Select
                                        value={formData.companyId || ""}
                                        onValueChange={(val) => setFormData({...formData, companyId: val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar empresa..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map(c => (
                                                <SelectItem key={c.id} value={c.id || 'invalid'}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground">
                                        El usuario pertenecerá exclusivamente a esta empresa.
                                    </p>
                                </div>
                            )}

                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                            <Button onClick={saveUser}>{isEditing ? 'Actualizar' : 'Crear Usuario'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL ELIMINAR */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Estás seguro?</DialogTitle>
                            <DialogDescription>
                                Esta acción eliminará permanentemente al usuario <strong>{formData.name}</strong>. No se puede deshacer.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                            <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </DashboardLayout>
    );
};

export default Users;