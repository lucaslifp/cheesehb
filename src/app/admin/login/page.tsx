
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { LogIn, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Verificar se já está logado ao carregar a página
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('isAdminLoggedIn') === 'true') {
      router.replace('/admin');
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    // Simulação de login
    // Em um cenário real, você faria uma chamada para sua API de autenticação aqui
    if (username === 'Admin' && password === '123456') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAdminLoggedIn', 'true');
      }
      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para o painel...',
      });
      router.push('/admin'); // Força o redirecionamento
    } else {
      const errorMsg = 'Usuário ou senha inválidos.';
      setLoginError(errorMsg);
      toast({
        title: 'Erro de Login',
        description: errorMsg,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Admin CheesePizza</CardTitle>
          <CardDescription>Faça login para acessar o painel de controle.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {loginError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro de Autenticação</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : <><LogIn className="mr-2 h-4 w-4" /> Entrar</>}
            </Button>
            <div className="text-center text-sm">
              <a href="#" className="text-primary hover:underline" onClick={(e) => { e.preventDefault(); toast({ title: "Funcionalidade em Desenvolvimento", description: "A recuperação de senha ainda será implementada."}) }}>
                Esqueceu sua senha? (Em breve)
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
       <p className="absolute bottom-4 text-xs text-muted-foreground">
        Login local simulado.
      </p>
    </div>
  );
}
