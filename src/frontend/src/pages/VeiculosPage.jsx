import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function VeiculosPage() {
  const qc = useQueryClient();
  const [clienteId, setClienteId] = useState('');
  const clientes = useQuery({
    queryKey: ['clientes-mini'],
    queryFn: () => apiGet('/api/clientes?pagina=1&tamanho=10'),
  });
  const veiculos = useQuery({
    queryKey: ['veiculos', clienteId],
    queryFn: () =>
      apiGet(`/api/veiculos${clienteId ? `?clienteId=${clienteId}` : ''}`),
  });
  const [form, setForm] = useState({
    placa: '',
    modelo: '',
    ano: '',
    clienteId: '',
  });

  const create = useMutation({
    mutationFn: (data) => apiPost('/api/veiculos', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['veiculos'] }),
  });
  const update = useMutation({
    mutationFn: ({ id, data }) => apiPut(`/api/veiculos/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['veiculos'] }),
  });
  const remover = useMutation({
    mutationFn: (id) => apiDelete(`/api/veiculos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['veiculos'] }),
  });

  useEffect(() => {
    if (clientes.data?.itens?.length && !clienteId) {
      setClienteId(clientes.data.itens[0].id);
      setForm((f) => ({ ...f, clienteId: clientes.data.itens[0].id }));
    }
  }, [clientes.data]);

  const [selectedCar, setSelectedCar] = useState(null);

  const handleUpdate = (car) => {
    update.mutate({
      id: car.id,
      data: {
        placa: car.placa,
        modelo: car.modelo,
        ano: car.ano,
        clienteId: car.clienteId,
      },
    });
  };

  return (
    <div>
      <h2>Veículos</h2>

      <div className="section">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label>Cliente: </label>
          <select
            value={clienteId}
            onChange={(e) => {
              setClienteId(e.target.value);
              setForm((f) => ({ ...f, clienteId: e.target.value }));
            }}
          >
            {clientes.data?.itens?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h3>Novo veículo</h3>
      <div className="section">
        <div className="grid grid-4">
          <input
            placeholder="Placa"
            value={form.placa}
            onChange={(e) => setForm({ ...form, placa: e.target.value })}
          />
          <input
            placeholder="Modelo"
            value={form.modelo}
            onChange={(e) => setForm({ ...form, modelo: e.target.value })}
          />
          <input
            placeholder="Ano"
            value={form.ano}
            onChange={(e) => setForm({ ...form, ano: e.target.value })}
          />
          <button
            onClick={() =>
              create.mutate({
                placa: form.placa,
                modelo: form.modelo,
                ano: form.ano ? Number(form.ano) : null,
                clienteId: form.clienteId || clienteId,
              })
            }
          >
            Salvar
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: 16 }}>Lista</h3>
      <div className="section">
        {veiculos.isLoading ? (
          <p>Carregando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Ano</th>
                <th>ClienteId</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {veiculos.data?.map((v) => (
                <tr key={v.id}>
                  <td>{v.placa}</td>
                  <td>{v.modelo}</td>
                  <td>{v.ano ?? '-'}</td>
                  <td>{v.clienteId}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setSelectedCar(v);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => remover.mutate(v.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="note">
          TODO: permitir troca de cliente na edição e garantir atualização sem
          recarregar a página (React Query já invalida a lista).
        </p>
      </div>

      <Dialog
        open={!!selectedCar}
        onOpenChange={(open) => !open && setSelectedCar(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Veículo</DialogTitle>
            <DialogDescription>
              Altere as informações do veículo abaixo. Clique em salvar quando
              terminar.
            </DialogDescription>
          </DialogHeader>

          {selectedCar && (
            <div className="grid gap-4 py-4">
              {/* Campo Modelo */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="modelo" className="text-right">
                  Modelo
                </Label>
                <Input
                  id="modelo"
                  value={selectedCar.modelo}
                  onChange={(e) =>
                    setSelectedCar({ ...selectedCar, modelo: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>

              {/* Campo Ano */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ano" className="text-right">
                  Ano
                </Label>
                <Input
                  id="ano"
                  type="number"
                  value={selectedCar.ano}
                  onChange={(e) =>
                    setSelectedCar({ ...selectedCar, ano: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cliente" className="text-right">
                  Cliente
                </Label>
                <Select
                  value={selectedCar?.clienteId}
                  onValueChange={(value) =>
                    setSelectedCar({ ...selectedCar, clienteId: value })
                  }
                >
                  <SelectTrigger id="cliente" className="col-span-3">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Clientes disponíveis</SelectLabel>
                      {clientes.data?.itens?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCar(null)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={() => {
                handleUpdate(selectedCar); // Sua função de atualização
                setSelectedCar(null);
              }}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
