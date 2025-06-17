
"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Clock, ArrowLeft, Edit2, AlertTriangle, ShieldCheck, Loader2, Settings } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { Switch } from '@/components/ui/switch';
import { SHOP_OPERATING_HOURS as DEFAULT_SHOP_HOURS, type DayOfWeek, SHOP_CURRENTLY_CLOSED_MESSAGE, SHOP_MANUALLY_OPEN_MESSAGE, SHOP_FORCED_MANUALLY_CLOSED_MESSAGE } from '@/lib/shop-config';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { LojaConfiguracao, HorarioDia, ShopOverrideStatus } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const DIAS_SEMANA: { index: DayOfWeek; nome: string }[] = [
  { index: 0, nome: 'Domingo' },
  { index: 1, nome: 'Segunda-feira' },
  { index: 2, nome: 'Terça-feira' },
  { index: 3, nome: 'Quarta-feira' },
  { index: 4, nome: 'Quinta-feira' },
  { index: 5, nome: 'Sexta-feira' },
  { index: 6, nome: 'Sábado' },
];

const getDefaultHorarios = (): HorarioDia[] => {
    return DIAS_SEMANA.map(diaInfo => {
      const configExistente = DEFAULT_SHOP_HOURS[diaInfo.index];
      return {
        diaIndex: diaInfo.index,
        nomeDia: diaInfo.nome,
        aberto: !!configExistente,
        abreAs: configExistente?.open || '18:00',
        fechaAs: configExistente?.close || '23:30',
      };
    });
};

export default function AdminConfiguracoesPage() {
  const [horariosConfig, setHorariosConfig] = useState<HorarioDia[]>(getDefaultHorarios());
  const [shopOverrideStatus, setShopOverrideStatus] = useState<ShopOverrideStatus>('automatico');
  const [customClosedMessage, setCustomClosedMessage] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfiguracoes = async () => {
      setIsLoadingPage(true);
      try {
        const response = await fetch('/api/admin/configuracoes-loja');
        if (!response.ok) {
            let errorDetail = 'Falha ao buscar configurações da loja.';
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson && errorJson.error) errorDetail = errorJson.error;
            } catch (e) { /* use raw errorText */ }
            throw new Error(errorDetail);
        }
        const data: LojaConfiguracao = await response.json();
        
        setShopOverrideStatus(data.override_status || 'automatico');
        setCustomClosedMessage(data.mensagem_loja_fechada_personalizada || SHOP_FORCED_MANUALLY_CLOSED_MESSAGE);

        if (data.horarios_funcionamento && Array.isArray(data.horarios_funcionamento) && data.horarios_funcionamento.length > 0) {
          const fetchedHorariosMap = new Map((data.horarios_funcionamento as HorarioDia[]).map(h => [h.diaIndex, h]));
          const completeHorarios = getDefaultHorarios().map(defaultDia =>
            fetchedHorariosMap.get(defaultDia.diaIndex) || defaultDia
          );
          setHorariosConfig(completeHorarios);
        } else {
          setHorariosConfig(getDefaultHorarios());
        }
      } catch (error: any) {
        toast({
          title: "Erro ao Carregar Configurações",
          description: error.message || "Não foi possível buscar as configurações salvas.",
          variant: "destructive",
        });
        // Fallback to defaults in case of error
        setHorariosConfig(getDefaultHorarios());
        setShopOverrideStatus('automatico');
        setCustomClosedMessage(SHOP_FORCED_MANUALLY_CLOSED_MESSAGE);
      } finally {
        setIsLoadingPage(false);
      }
    };
    fetchConfiguracoes();
  }, []);

  const handleDiaAbertoToggle = (diaIndex: DayOfWeek, checked: boolean) => {
    setHorariosConfig(prev => prev.map(dia => (dia.diaIndex === diaIndex ? { ...dia, aberto: checked } : dia)));
  };

  const handleTimeChange = (diaIndex: DayOfWeek, tipo: 'abreAs' | 'fechaAs', value: string) => {
    setHorariosConfig(prev => prev.map(dia => (dia.diaIndex === diaIndex ? { ...dia, [tipo]: value } : dia)));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    const payload: Partial<LojaConfiguracao> = {
      horarios_funcionamento: horariosConfig,
      override_status: shopOverrideStatus,
      mensagem_loja_fechada_personalizada: shopOverrideStatus === 'forcar_fechado' ? (customClosedMessage || SHOP_FORCED_MANUALLY_CLOSED_MESSAGE) : null,
    };
    
    try {
      const response = await fetch('/api/admin/configuracoes-loja', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let errorDetail = 'Falha ao salvar configurações.';
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson && errorJson.error) errorDetail = errorJson.error;
        } catch (e) { /* use raw errorText */ }
        throw new Error(errorDetail);
      }
      const savedData: LojaConfiguracao = await response.json();
      
      // Update state from the saved data to ensure consistency
      setShopOverrideStatus(savedData.override_status || 'automatico');
      setCustomClosedMessage(savedData.mensagem_loja_fechada_personalizada || SHOP_FORCED_MANUALLY_CLOSED_MESSAGE);

      if (savedData.horarios_funcionamento && Array.isArray(savedData.horarios_funcionamento) && savedData.horarios_funcionamento.length > 0) {
         const fetchedHorariosMap = new Map((savedData.horarios_funcionamento as HorarioDia[]).map(h => [h.diaIndex, h]));
          const completeHorarios = getDefaultHorarios().map(defaultDia =>
            fetchedHorariosMap.get(defaultDia.diaIndex) || defaultDia
          );
        setHorariosConfig(completeHorarios);
      } else {
        setHorariosConfig(getDefaultHorarios());
      }
      toast({ title: "Configurações Salvas!", description: "As alterações de horário e status da loja foram salvas." });
    } catch (error: any) {
      toast({ title: "Erro ao Salvar Configurações", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingPage) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Carregando configurações...</p>
        </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Configurações Gerais da Loja</h1>
      </div>
      <div className="space-y-8">

        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" /> Status da Loja</CardTitle>
                <CardDescription>
                    Controle manualmente se a loja está aberta ou fechada, sobrepondo os horários padrão abaixo.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="w-full sm:w-auto sm:min-w-[250px]">
                    <Label htmlFor="shopOverrideStatusSelect" className="text-sm font-medium">Controle Manual da Loja:</Label>
                    <Select
                        value={shopOverrideStatus}
                        onValueChange={(value: ShopOverrideStatus) => setShopOverrideStatus(value)}
                        disabled={isSaving}
                    >
                        <SelectTrigger id="shopOverrideStatusSelect" className="h-10 text-sm mt-1">
                        <SelectValue placeholder="Status da loja" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="automatico">Automático (Seguir Horários)</SelectItem>
                        <SelectItem value="forcar_aberto">Forçar Loja Aberta</SelectItem>
                        <SelectItem value="forcar_fechado">Forçar Loja Fechada</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {shopOverrideStatus === 'forcar_aberto' && (
                    <Alert variant="default" className="mt-4 bg-green-50 border-green-500 text-green-700">
                        <ShieldCheck className="h-4 w-4 !text-green-600" />
                        <AlertTitle>{SHOP_MANUALLY_OPEN_MESSAGE}</AlertTitle>
                        <AlertDescription>A loja está configurada para ficar aberta manualmente, ignorando os horários abaixo.</AlertDescription>
                    </Alert>
                )}
                {shopOverrideStatus === 'forcar_fechado' && (
                    <div className="space-y-3 mt-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Loja Forçada a Fechar</AlertTitle>
                            <AlertDescription>
                            A loja está configurada para ficar fechada manualmente.
                            A mensagem "{customClosedMessage || SHOP_FORCED_MANUALLY_CLOSED_MESSAGE}" será exibida aos clientes.
                            </AlertDescription>
                        </Alert>
                        <div>
                            <Label htmlFor="customClosedMessageInput" className="text-sm font-medium">Mensagem Personalizada (Loja Fechada Manualmente):</Label>
                            <Input 
                                id="customClosedMessageInput"
                                value={customClosedMessage || ""} 
                                onChange={(e) => setCustomClosedMessage(e.target.value)}
                                placeholder={SHOP_FORCED_MANUALLY_CLOSED_MESSAGE}
                                className="h-9 text-sm mt-1"
                                disabled={isSaving}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Se vazio, a mensagem padrão "{SHOP_FORCED_MANUALLY_CLOSED_MESSAGE}" será usada.</p>
                        </div>
                    </div>
                )}
                 {shopOverrideStatus === 'automatico' && (
                    <Alert variant="default" className="mt-4 bg-blue-50 border-blue-500 text-blue-700">
                        <Clock className="h-4 w-4 !text-blue-600" />
                        <AlertTitle>Modo Automático Ativado</AlertTitle>
                        <AlertDescription>A loja seguirá os horários de funcionamento padrão definidos abaixo.</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" /> Horários de Funcionamento Padrão</CardTitle>
            <CardDescription>
              Defina os horários de operação para cada dia da semana. Estes horários são usados se o controle manual estiver "Automático".
            </CardDescription>
          </CardHeader>
          <CardContent className={cn(shopOverrideStatus !== 'automatico' && 'opacity-60 pointer-events-none')}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Dia da Semana</TableHead>
                    <TableHead className="text-center w-[150px]">Status</TableHead>
                    <TableHead className="w-[120px]">Abre às</TableHead>
                    <TableHead className="w-[120px]">Fecha às</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {horariosConfig.map((dia) => (
                    <TableRow key={dia.diaIndex}>
                      <TableCell className="font-medium">{dia.nomeDia}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Switch
                            id={`aberto-${dia.diaIndex}`}
                            checked={dia.aberto}
                            onCheckedChange={(checked) => handleDiaAbertoToggle(dia.diaIndex as DayOfWeek, checked)}
                            disabled={isSaving || shopOverrideStatus !== 'automatico'}
                          />
                          <Label htmlFor={`aberto-${dia.diaIndex}`} className={cn("text-xs", dia.aberto ? "text-green-600" : "text-destructive")}>
                            {dia.aberto ? 'Aberto' : 'Fechado'}
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell>
                        {dia.aberto && (
                          <Input
                            id={`abre-${dia.diaIndex}`}
                            type="time"
                            value={dia.abreAs}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleTimeChange(dia.diaIndex as DayOfWeek, 'abreAs', e.target.value)}
                            className="h-9 text-xs"
                            disabled={isSaving || shopOverrideStatus !== 'automatico'}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {dia.aberto && (
                          <Input
                            id={`fecha-${dia.diaIndex}`}
                            type="time"
                            value={dia.fechaAs}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleTimeChange(dia.diaIndex as DayOfWeek, 'fechaAs', e.target.value)}
                            className="h-9 text-xs"
                            disabled={isSaving || shopOverrideStatus !== 'automatico'}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Button onClick={handleSaveChanges} size="lg" className="w-full sm:w-auto" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Edit2 className="mr-2 h-5 w-5" />}
            {isSaving ? "Salvando..." : "Salvar Configurações Gerais"}
          </Button>
          <Link href="/admin">
            <Button variant="outline" size="lg" className="w-full sm:w-auto" disabled={isSaving}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
    
