import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trash2,
  UploadCloud,
  Pencil,
  Save,
  Check,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { convertToCsvFile } from '../auxFunctions/fromArrayToCsv';

export default function CsvUploadPage() {
  const [report, setReport] = useState(null);
  const [editableErrors, setEditableErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const splitCsvLine = (line) => {
    const result = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^$)/g);
    return result ? result.map((v) => v.replace(/^"|"$/g, '')) : [];
  };

  const parseErrors = (errorStrings) => {
    return errorStrings.map((errStr, index) => {
      const match = errStr.match(/Linha \d+: (.*) \(raw='(.*)'\)/);
      const motivo = match ? match[1] : 'Erro desconhecido';
      const rawData = match ? match[2] : '';
      const v = splitCsvLine(rawData);

      return {
        index,
        motivo,
        placa: v[0] || '',
        modelo: v[1] || '',
        ano: v[2] || '',
        cliente_identificador: v[3] || '',
        cliente_nome: v[4] || '',
        cliente_telefone: v[5] || '',
        cliente_endereco: v[6] || '',
        mensalista: v[7] || '',
        valor_mensalidade: v[8] || '',
      };
    });
  };

  async function uploadCsvFile(file) {
    if (!file) return;

    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const r = await fetch(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000') +
          '/api/import/csv',
        { method: 'POST', body: fd },
      );
      const j = await r.json();

      setReport(j);
      if (j.erros && j.erros.length > 0) {
        setEditableErrors(parseErrors(j.erros));
      } else {
        setEditableErrors([]);
        alert('Sucesso! Todos os dados foram importados.');
      }
    } catch (err) {
      console.error('Erro no upload:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = e.target.file.files[0];
    await uploadCsvFile(file);
  }

  async function handleResubmit() {
    const fixedFile = convertToCsvFile(editableErrors);
    await uploadCsvFile(fixedFile);
  }

  const handleInputChange = (index, field, value) => {
    const updated = [...editableErrors];
    updated[index][field] = value;
    setEditableErrors(updated);
  };

  console.log(editableErrors);

  const removerLinha = (index) => {
    const newEditableErrors = editableErrors.filter((row) => {
      return row.index !== index;
    });
    setEditableErrors(newEditableErrors);
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5" /> Importação de Veículos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="flex items-center gap-4">
            <Input type="file" name="file" accept=".csv" className="max-w-sm" />
            <Button type="submit" disabled={loading}>
              {loading ? 'Processando...' : 'Carregar CSV'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Processados
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {report.processados || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-slate-400" />
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 uppercase tracking-wider">
                  Inseridos
                </p>
                <p className="text-3xl font-bold text-green-700">
                  {report.inseridos || 0}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 uppercase tracking-wider">
                  Erros
                </p>
                <p className="text-3xl font-bold text-red-700">
                  {report.erros?.length || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </CardContent>
          </Card>
        </div>
      )}

      {editableErrors.length > 0 && (
        <Card className="border-red-200 shadow-md">
          <CardHeader className="bg-red-50/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-red-800">
                Correção de Inconsistências
              </CardTitle>
              <p className="text-sm text-red-600/80">
                Edite as linhas abaixo para tentar reenviar.
              </p>
            </div>
            <Button
              onClick={() => handleResubmit(editableErrors)}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" /> Reenviar Corrigidos
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Motivo do Erro</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="w-28 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editableErrors.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs font-semibold text-red-600 italic max-w-[200px] truncate">
                      {row.motivo}
                    </TableCell>
                    <TableCell className="font-mono">{row.placa}</TableCell>
                    <TableCell>{row.modelo}</TableCell>
                    <TableCell>R$ {row.valor_mensalidade}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Pencil className="w-4 h-4 text-slate-600" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>
                                Editar Registro Completo
                              </DialogTitle>
                              <p className="text-sm text-red-500 font-medium">
                                Motivo: {row.motivo}
                              </p>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Placa</Label>
                                  <Input
                                    value={row.placa}
                                    onChange={(e) =>
                                      handleInputChange(
                                        idx,
                                        'placa',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Modelo</Label>
                                  <Input
                                    value={row.modelo}
                                    onChange={(e) =>
                                      handleInputChange(
                                        idx,
                                        'modelo',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Ano</Label>
                                  <Input
                                    type="number"
                                    value={row.ano}
                                    onChange={(e) =>
                                      handleInputChange(
                                        idx,
                                        'ano',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>ID Cliente</Label>
                                  <Input
                                    value={row.cliente_identificador}
                                    onChange={(e) =>
                                      handleInputChange(
                                        idx,
                                        'cliente_identificador',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Telefone</Label>
                                  <Input
                                    value={row.cliente_telefone}
                                    onChange={(e) =>
                                      handleInputChange(
                                        idx,
                                        'cliente_telefone',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Nome do Cliente</Label>
                                <Input
                                  value={row.cliente_nome}
                                  onChange={(e) =>
                                    handleInputChange(
                                      idx,
                                      'cliente_nome',
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Endereço</Label>
                                <Input
                                  value={row.cliente_endereco}
                                  onChange={(e) =>
                                    handleInputChange(
                                      idx,
                                      'cliente_endereco',
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Mensalista (true/false)</Label>
                                  <Input
                                    value={row.mensalista}
                                    onChange={(e) =>
                                      handleInputChange(
                                        idx,
                                        'mensalista',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Valor Mensalidade</Label>
                                  <Input
                                    value={row.valor_mensalidade}
                                    onChange={(e) =>
                                      handleInputChange(
                                        idx,
                                        'valor_mensalidade',
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            <DialogFooter>
                              <DialogClose asChild>
                                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                                  <Check className="w-4 h-4 mr-2" /> Salvar
                                  Alterações
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                          onClick={() => removerLinha(row.index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
