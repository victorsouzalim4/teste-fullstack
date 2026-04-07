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
import { Trash2 } from 'lucide-react';
import { UploadCloud, Pencil, Save, Check } from 'lucide-react';

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

  async function handleUpload(e) {
    e.preventDefault();
    setLoading(true);
    const file = e.target.file.files[0];
    if (!file) return;

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
      if (j.erros) setEditableErrors(parseErrors(j.erros));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (index, field, value) => {
    const updated = [...editableErrors];
    updated[index][field] = value;
    setEditableErrors(updated);
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

      {editableErrors.length > 0 && (
        <Card className="border-red-200 shadow-md">
          <CardHeader className="bg-red-50/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-red-800">
                Inconsistências Encontradas
              </CardTitle>
              <p className="text-sm text-red-600/80">
                Corrija os dados abaixo para re-processar.
              </p>
            </div>
            <Button
              onClick={() => console.log('Dados prontos:', editableErrors)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" /> Finalizar Correções
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Motivo</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Valor (R$)</TableHead>
                  <TableHead className="w-24 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editableErrors.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs font-medium text-red-600 max-w-[120px] truncate">
                      {row.motivo}
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-28"
                        value={row.placa}
                        onChange={(e) =>
                          handleInputChange(idx, 'placa', e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-32"
                        value={row.modelo}
                        onChange={(e) =>
                          handleInputChange(idx, 'modelo', e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-24"
                        value={row.valor_mensalidade}
                        onChange={(e) =>
                          handleInputChange(
                            idx,
                            'valor_mensalidade',
                            e.target.value,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const novaLista = editableErrors.filter(
                              (_, index) => index !== idx,
                            );
                            setEditableErrors(novaLista);
                          }}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="w-4 h-4 text-blue-600" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>
                                Editar Informações Completas
                              </DialogTitle>
                              <p className="text-sm text-muted-foreground italic">
                                Erro: {row.motivo}
                              </p>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                              <div className="grid grid-cols-2 gap-4 border-b pb-4">
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
                              </div>

                              <div className="grid gap-4">
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
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Identificador (ID)</Label>
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
                                  <Label>Endereço Completo</Label>
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
                              </div>
                            </div>

                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button" className="w-full">
                                  <Check className="w-4 h-4 mr-2" /> Confirmar
                                  Alteração
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
