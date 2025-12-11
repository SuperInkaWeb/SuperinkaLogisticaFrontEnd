import React, { useState } from 'react';
import { useUsers, dataService } from '@/hooks/useSupabaseData';
import { useAuth } from '@/frontend/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users as UsersIcon, Plus, Shield, UserCheck, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const Users: React.FC = () => {
  const { data: users, loading: usersLoading, refetch } = useUsers();
  const { user: currentUser, permissions } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'operador' as 'admin' | 'supervisor' | 'operador',
  });

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Administrador', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: Shield },
      supervisor: { label: 'Supervisor', className: 'bg-warning/10 text-warning border-warning/20', icon: UserCheck },
      operador: { label: 'Operador', className: 'bg-info/10 text-info border-info/20', icon: User },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.operador;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'supervisor' | 'operador') => {
    try {
      await dataService.updateUserRole(userId, newRole);
      toast.success('Rol actualizado correctamente');
      refetch();
    } catch (error) {
      toast.error('Error al actualizar el rol');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Crear perfil en la tabla profiles
        await dataService.createUserProfile({
          id: authData.user.id,
          email: newUser.email,
          name: newUser.name,
        });

        // Crear rol del usuario
        await dataService.createUserRole(authData.user.id, newUser.role);

        toast.success('Usuario creado correctamente. Se ha enviado un correo de confirmación.');
        setIsDialogOpen(false);
        setNewUser({
          email: '',
          name: '',
          password: '',
          role: 'operador',
        });
        refetch();
      }
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('User already registered')) {
        toast.error('Este correo ya está registrado');
      } else {
        toast.error('Error al crear el usuario');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (usersLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Usuarios y Roles</h1>
            <p className="text-muted-foreground">Administra los usuarios del sistema</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios y Roles</h1>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>
        {permissions?.canManageUsers && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-inka text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Crea una nueva cuenta de usuario para el sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    placeholder="Juan Pérez"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value as 'admin' | 'supervisor' | 'operador' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={isSubmitting}>
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { role: 'admin', label: 'Administradores', icon: Shield, color: 'text-destructive' },
          { role: 'supervisor', label: 'Supervisores', icon: UserCheck, color: 'text-warning' },
          { role: 'operador', label: 'Operadores', icon: User, color: 'text-info' },
        ].map((item) => {
          const Icon = item.icon;
          const count = users.filter(u => u.role === item.role).length;
          
          return (
            <Card key={item.role}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${item.color}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            Lista de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                {permissions?.canManageUsers && (
                  <TableHead className="text-right">Cambiar Rol</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-inka flex items-center justify-center text-primary-foreground font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    {permissions?.canManageUsers && (
                      <TableCell className="text-right">
                        {user.id !== currentUser?.id ? (
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value as 'admin' | 'supervisor' | 'operador')}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="supervisor">Supervisor</SelectItem>
                              <SelectItem value="operador">Operador</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground text-sm">Tu cuenta</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={permissions?.canManageUsers ? 4 : 3} className="text-center text-muted-foreground py-8">
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
