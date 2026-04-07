import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '../api';
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
import { Checkbox } from '@/components/ui/checkbox';

export default function ClientesPage() {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState('');
  const [mensalista, setMensalista] = useState('all');
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    endereco: '',
    mensalista: false,
    valorMensalidade: '',
  });

  const q = useQuery({
    queryKey: ['clientes', filtro, mensalista],
    queryFn: () =>
      apiGet(
        `/api/clientes?pagina=1&tamanho=20&filtro=${encodeURIComponent(filtro)}&mensalista=${mensalista}`,
      ),
  });

  const create = useMutation({
    mutationFn: (data) => apiPost('/api/clientes', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });

  const remover = useMutation({
    mutationFn: (id) => apiDelete(`/api/clientes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });

  const [selectedClient, setSelectedClient] = useState(null);

  const handleUpdate = (client) => {};

  return (
    <div>
      <h2>Clientes</h2>

      <div className="section">
        <div className="grid grid-3">
          <input
            placeholder="Buscar por nome"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          <select
            value={mensalista}
            onChange={(e) => setMensalista(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="true">Mensalistas</option>
            <option value="false">Não mensalistas</option>
          </select>
          <div />
        </div>
      </div>

      <h3>Novo cliente</h3>
      <div className="section">
        <div className="grid grid-4">
          <input
            placeholder="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <input
            placeholder="Telefone"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
          <input
            placeholder="Endereço"
            value={form.endereco}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.mensalista}
              onChange={(e) =>
                setForm({ ...form, mensalista: e.target.checked })
              }
            />{' '}
            Mensalista
          </label>
          <input
            placeholder="Valor mensalidade"
            value={form.valorMensalidade}
            onChange={(e) =>
              setForm({ ...form, valorMensalidade: e.target.value })
            }
          />
          <div />
          <div />
          <button
            onClick={() =>
              create.mutate({
                nome: form.nome,
                telefone: form.telefone,
                endereco: form.endereco,
                mensalista: form.mensalista,
                valorMensalidade: form.valorMensalidade
                  ? Number(form.valorMensalidade)
                  : null,
              })
            }
          >
            Salvar
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: 16 }}>Lista</h3>
      <div className="section">
        {q.isLoading ? (
          <p>Carregando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Mensalista</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {q.data.itens.map((c) => (
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td>{c.telefone}</td>
                  <td>{c.mensalista ? 'Sim' : 'Não'}</td>
                  <td>
                    <Button
                      className="btn-ghost"
                      onClick={() => remover.mutate(c.id)}
                    >
                      Excluir
                    </Button>
                    <Button
                      onClick={() => {
                        console.log(c);
                        setSelectedClient(c);
                      }}
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog
        open={!!selectedClient}
        onOpenChange={(open) => !open && setSelectedClient(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Altere as informações do cliente abaixo. Clique em salvar quando
              terminar.
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="grid gap-4 py-4">
              {/* Nome */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome" className="text-right">
                  Nome
                </Label>
                <Input
                  id="nome"
                  value={selectedClient.nome}
                  onChange={(e) =>
                    setSelectedClient({
                      ...selectedClient,
                      nome: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>

              {/* Telefone */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="telefone" className="text-right">
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  value={selectedClient.telefone}
                  onChange={(e) =>
                    setSelectedClient({
                      ...selectedClient,
                      telefone: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endereco" className="text-right">
                  Endereço
                </Label>
                <Input
                  id="endereco"
                  value={selectedClient.endereco}
                  onChange={(e) =>
                    setSelectedClient({
                      ...selectedClient,
                      endereco: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>

              {/* Valor da Mensalidade */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="valorMensalidade" className="text-right">
                  Mensalidade
                </Label>
                <Input
                  id="valorMensalidade"
                  type="number"
                  value={selectedClient.valorMensalidade}
                  onChange={(e) =>
                    setSelectedClient({
                      ...selectedClient,
                      valorMensalidade: parseFloat(e.target.value),
                    })
                  }
                  className="col-span-3"
                />
              </div>

              {/* Status Mensalista */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mensalista" className="text-right">
                  Mensalista
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="mensalista"
                    checked={selectedClient.mensalista}
                    onCheckedChange={(checked) =>
                      setSelectedClient({
                        ...selectedClient,
                        mensalista: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="mensalista" className="text-sm font-normal">
                    Ativo
                  </Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClient(null)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={() => {
                handleUpdate(selectedClient);
                setSelectedClient(null);
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
