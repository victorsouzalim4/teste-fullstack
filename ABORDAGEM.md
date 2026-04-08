## 🚀 1. Implementações Realizadas

### 🔹 Tarefa 1: Gestão Avançada de Clientes

- **Interface:** Implementação de edição via **Dialog (Modal)**, permitindo alteração de Nome, Telefone, Endereço, Valor e Status de Mensalista.

### 🔹 Tarefa 2: Gestão de Veículos e Transferência de Posse

- **Manutenção:** Edição de Modelo e Ano via interface dinâmica.
- **Troca de Cliente:** Implementação de seletor que permite a nova associação de um veículo. Esta ação aciona automaticamente a lógica de encerramento do vínculo anterior e abertura de um novo registro no histórico de posse.

### 🔹 Tarefa 3: Importação de Dados (CSV Inteligente)

- **Resiliência:** O processo de upload agora retorna um sumário detalhado: _Linhas Processadas vs. Inseridas vs. Erros_.
- **Correção On-the-fly:** As linhas com erro são exibidas em uma tabela editável no próprio Frontend. O usuário corrige os dados e reenvia sem precisar editar o arquivo CSV original, reduzindo drasticamente o atrito operacional.

### 🔹 Tarefa 4: Lógica de Faturamento Proporcional

A entrega da tarefa abaixo exigiu uma mudança de paradigma no banco de dados. No modelo anterior, o sistema sofria com a **falta de rastreabilidade**: não havia histórico de posse de veículos, o que impossibilitava auditorias e cálculos retroativos precisos.

### Decisão de Engenharia: Vínculos

Migrei o modelo mental de "status atual" para um modelo de **Vínculos**. Agora, o faturamento e a posse são tratados como queries de intervalos de datas em uma linha do tempo contínua.

**Estrutura da Tabela `Vinculo_Veiculo`:**
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `veiculo_id` | FK | Identificador único do veículo. |
| `cliente_id` | FK | Identificador único do cliente. |
| `data_inicio` | DateTime | Início da vigência da posse. |
| `data_fim` | DateTime | Término da vigência (NULL se o vínculo estiver ativo). |
| `valor_mensalidade`| Decimal | Valor acordado no momento da assinatura (Snapshot de preço). |

---

Para calcular o faturamento de um mês específico sem depender de condicionais complexas, foi utiliziada a lógica abordagem abaixo:

**1. Cálculo de Dias Ativos por Vínculo:**
$$Dias = (\min(\text{DataFim}, \text{FimDoMes}) - \max(\text{DataInicio}, \text{InicioDoMes})) + 1$$

**2. Cálculo do Valor Total da Fatura:**
O valor final é o somatório do proporcional de cada vínculo (veículo) que esteve sob posse do cliente no período:
$$\text{Valor Total} = \sum_{v=1}^{n} \left( \text{Dias}_v \times \frac{\text{ValorMensalidade}_v}{30} \right)$$

- **Vantagem:** Trata automaticamente cenários onde o cliente utiliza o veículo em períodos alternados no mesmo mês, somando as fatias de tempo de forma transparente.

---

## 🐞 2. Backlog de Erros e Pontos de Atenção (Bugs Detectados)

Identifiquei pontos críticos que precisam de intervenção imediata para garantir a consistência e escalabilidade:

1.  **Sincronização do CSV:** O método de importação de CSV ainda não realiza a vinculação automática baseada na nova lógica de histórico. É necessário atualizar o parser para criar os registros na tabela `Vinculo_Veiculo`.
2.  **Inconsistência de Reajuste:** Atualmente, ao alterar o valor da mensalidade no cadastro do cliente, a alteração não é refletida nos vínculos ativos.
    - **Proposta de Solução:** Implementar o encerramento do vínculo atual e a criação automática de um novo vínculo com o valor reajustado, garantindo a independência histórica entre períodos (Imutabilidade).
3.  **Race Conditions :** O sistema está vulnerável a condições de corrida. Exemplo: um `Delete` pode ser executado enquanto um `Update` está em trânsito. É necessário implementar algum método de tratamento de concorrência (Timestamp por exemplo) ou travas de transação no Postgres.
4.  **Performance no Front:** O backend já suporta paginação, porém o frontend não implementa (não há lógica de busca de novas páginas).

## 📈 3. Roadmap de Refatoração (Visão Arquitetural)

### 1. Identidade e Performance

- **Chaves de Negócio:** Substituir a combinação `Nome + Telefone` por **CPF** como chave discriminatória única.
- **Indexação:** Criar índices indiretos no Postgres (`CPF -> ID -> MEM_ADRESS`) para otimizar a busca e evitar scans desnecessários em tabelas grandes.

### 2. Segurança e Abstração de Dados

- **Privacidade:** Ocultar IDs internos do banco de dados na camada de interface. Usuários devem interagir com identificadores de negócio (CPF por ex).

### 3. Reatividade em Tempo Real

- **Database Listeners:** Migrar do modelo de resposta baseada apenas em Promises para **Listeners** (Sockets). Isso permitiria que o client-side reflita alterações feitas por terceiros em tempo real.

### 4. UX e Fluxo de Trabalho

- **Consolidação de Contexto:** O fluxo atual é fragmentado. A edição de veículos (baseada em filtro de cliente) deveria ser integrada diretamente na tela de gestão do cliente, centralizando as ações em uma visão 360º.
- **Design System:** Revisão do design de telas para melhorar a hierarquia visual e reduzir a carga cognitiva do operador.

---
