import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useApiData, User } from "@/hooks/useApiData"; // Usamos la interfaz User correcta
import { useToast } from "@/hooks/use-toast";
import { Search, User as UserIcon, Shield, Trash2, Edit, Plus, UserCog, Briefcase, Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Users: React.FC = () => {
    // Conectamos con los métodos de Usuarios del hook, no de Sellers
    const { getUsers, createUser, updateUser, deleteUser } = useApiData();
    const { toast } = useToast();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtro
    const [searchTerm, setSearchTerm] = useState("");

    // Modales
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Estado para Edición/Creación
    const [currentUser, setCurrentUser] = useState<Partial<User>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error cargando usuarios", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- FILTRADO ---
    const filteredUsers = users.filter(user => {
        const search = searchTerm.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(search);
        const emailMatch = user.email?.toLowerCase().includes(search);
        return nameMatch || emailMatch;
    });

    // --- HANDLERS DEL CRUD ---

    const handleCreate = () => {
        // Inicializamos con rol limpio 'operador' por defecto
        setCurrentUser({ name: "", email: "", role: "operador", password: "" });
        setIsEditing(false);
        setIsFormOpen(true);
        setShowPassword(false);
    };

    const handleEdit = (user: User) => {
        // Normalizamos el rol en caso de que venga sucio, pero preferimos el valor directo
        // El backend UserController espera el rol sin prefijos (ej: "admin", "operador")
        let currentRole = user.role?.toLowerCase().replace('role_', '') || 'operador';

        // Al editar, la contraseña empieza vacía (solo se envía si se quiere cambiar)
        setCurrentUser({ ...user, role: currentRole, password: "" });
        setIsEditing(true);
        setIsFormOpen(true);
        setShowPassword(false);
    };

    const handleDeleteClick = (user: User) => {
        setCurrentUser(user);
        setIsDeleteOpen(true);
    };

    const saveUser = async () => {
        // Validación básica
        if (!currentUser.name || !currentUser.email) {
            toast({ variant: "destructive", title: "Error", description: "Nombre y Email son obligatorios." });
            return;
        }

        // Validación de contraseña para nuevos usuarios
        if (!isEditing && !currentUser.password) {
            toast({ variant: "destructive", title: "Error", description: "La contraseña es obligatoria para nuevos usuarios." });
            return;
        }

        try {
            if (isEditing) {
                // Si el campo password está vacío, lo eliminamos para no enviarlo vacío
                const userToUpdate = { ...currentUser };
                if (!userToUpdate.password) {
                    delete userToUpdate.password;
                }

                if (currentUser.id) {
                    await updateUser(currentUser.id, userToUpdate as User);
                    // Actualizar lista localmente
                    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...userToUpdate } as User : u));
                    toast({ title: "Usuario Actualizado", description: `Datos de ${currentUser.name} guardados.` });
                }
            } else {
                // Crear nuevo usuario
                await createUser(currentUser as User);
                // Recargamos datos para obtener el ID generado y asegurar consistencia
                loadData();
                toast({ title: "Usuario Creado", description: `Bienvenido ${currentUser.name}` });
            }
            setIsFormOpen(false);
        } catch (error) {
            console.error(error);
            // El hook ya muestra el error via toast
        }
    };

    const confirmDelete = async () => {
        if (!currentUser.id) return;
        try {
            const success = await deleteUser(currentUser.id);
            if (success) {
                setUsers(prev => prev.filter(u => u.id !== currentUser.id));
                toast({ title: "Usuario Eliminado", description: "Cuenta removida del sistema." });
                setIsDeleteOpen(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getRoleBadge = (role: string = '') => {
        // Normalizar para visualización
        const normalizedRole = role.toLowerCase().replace('role_', '');

        switch (normalizedRole) {
            case 'admin':
            case 'super_admin':
                return <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"><Shield className="w-3 h-3 mr-1"/> Admin</Badge>;
            case 'supervisor':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"><UserCog className="w-3 h-3 mr-1"/> Supervisor</Badge>;
            case 'operador':
                return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"><Briefcase className="w-3 h-3 mr-1"/> Operador</Badge>;
            case 'heladero':
                // Aunque los heladeros se gestionan en otra vista, si aparecieran aquí:
                return <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200">Heladero</Badge>;
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
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
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
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input
                                    id="name"
                                    value={currentUser.name || ''}
                                    onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={currentUser.email || ''}
                                    onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                                />
                            </div>
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
                                        value={currentUser.password || ''}
                                        onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
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
                            <div className="space-y-2">
                                <Label htmlFor="role">Rol del Sistema</Label>
                                <Select
                                    value={currentUser.role}
                                    onValueChange={(val) => setCurrentUser({...currentUser, role: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Usamos valores directos según lo que espera AppRole.valueOf() en backend */}
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="supervisor">Supervisor</SelectItem>
                                        <SelectItem value="operador">Operador</SelectItem>
                                        <SelectItem value="cliente">Cliente</SelectItem>
                                        <SelectItem value="heladero">Heladero</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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
                                Esta acción eliminará permanentemente al usuario <strong>{currentUser.name}</strong>. No se puede deshacer.
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