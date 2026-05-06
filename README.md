# QueueLess

QueueLess é um sistema de gestão de filas em tempo real desenvolvido para pequenos negócios que precisam organizar o fluxo de clientes de forma simples, segura e profissional.

A aplicação oferece dashboards protegidos por autenticação, controle operacional da fila, tela pública em tempo real e métricas diárias de atendimento.

## Visão Geral

O QueueLess permite que um estabelecimento:

- Adicione clientes à fila ativa.
- Edite, chame, conclua ou cancele entradas da fila.
- Exiba a fila atual em uma tela pública com atualização em tempo real.
- Acompanhe métricas operacionais do dia.
- Monitore tempo médio de espera e pico de movimento por horário.

O projeto foi construído com uma arquitetura orientada a produção, utilizando Next.js App Router, Supabase Auth, Supabase Database, Supabase Realtime, Tailwind CSS, componentes compatíveis com Shadcn/UI e Recharts.

## Stack Técnica

- **Framework:** Next.js App Router
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Sistema de UI:** Componentes compatíveis com Shadcn/UI
- **Backend as a Service:** Supabase
- **Autenticação:** Supabase Auth
- **Banco de Dados:** Supabase PostgreSQL
- **Tempo Real:** Supabase Realtime
- **Gráficos:** Recharts

## Estrutura do Projeto

```text
src/
  app/
    auth/
      callback/        Rota de callback do Supabase Auth
      sign-out/        Route handler para logout
    dashboard/         Dashboard operacional protegido
    login/             Página de autenticação
    public/[businessId]/ Tela pública da fila
  components/
    analytics/         Componentes do painel de métricas
    auth/              Interface de autenticação
    layout/            Shell da aplicação e navegação
    queue/             Gestão da fila e tela pública
    ui/                Primitivos reutilizáveis compatíveis com Shadcn/UI
  hooks/
    use-queue-realtime.ts Lógica de inscrição realtime da fila
  lib/
    supabase/          Clients, middleware e helpers de ambiente do Supabase
    utils.ts           Funções utilitárias compartilhadas
  services/
    analytics.ts       Consultas e agregações de métricas
    profile.ts         Operações do perfil do estabelecimento
    queue.ts           Regras de negócio e mutações da fila
  types/
    database.ts        Contrato tipado do banco de dados

supabase/
  migrations/          Schema SQL, políticas, triggers e configuração realtime
```

## Funcionalidades Principais

### Autenticação

A autenticação é realizada com Supabase Auth.

Fluxos disponíveis:

- Login por link mágico enviado por email.
- Login com email e senha.
- Criação de conta com configuração do estabelecimento.
- Rota de callback para troca de código por sessão.
- Validação de sessão no servidor para rotas protegidas.

### Dashboard Protegida

A dashboard utiliza o Next.js App Router e valida o usuário autenticado no servidor antes de expor os dados do estabelecimento.

A dashboard inclui:

- Gestão da fila ativa.
- Link para a tela pública.
- Painel de métricas diárias.
- Configuração inicial de perfil quando o estabelecimento ainda não existe.

### Gestão da Fila

O módulo de fila oferece suporte a:

- Criação de entradas na fila.
- Edição dos dados do cliente.
- Chamada do próximo cliente em espera.
- Conclusão do atendimento com registro no histórico.
- Cancelamento de entradas.
- Estados de carregamento, erro e lista vazia.

### Tela Pública da Fila

A rota pública exibe:

- Nome do estabelecimento.
- Cliente chamado no momento.
- Clientes aguardando.
- Atualizações automáticas em tempo real por meio do Supabase Realtime.

Formato da rota pública:

```text
/public/[businessId]
```

O valor de `businessId` pode ser o UUID do perfil ou o slug público gerado para o estabelecimento.

### Métricas e Analytics

O painel de analytics inclui:

- Total de atendimentos do dia.
- Tempo médio de espera.
- Horário de pico de movimento.
- Gráfico de atendimentos por hora utilizando Recharts.

## Schema do Banco de Dados

O schema do banco está definido em:

```text
supabase/migrations/20260505203000_initial_schema.sql
```

Tabelas principais:

- `profiles`
- `queue_entries`
- `attendance_history`

A migration também configura:

- Enum `queue_status`.
- Triggers de atualização de `updated_at`.
- Trigger para criação automática de perfil ao cadastrar usuário.
- Políticas de Row Level Security.
- Publicação Realtime para fila e métricas.

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

A aplicação também aceita a variável pública legada do Supabase:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

É necessário informar pelo menos uma das variáveis `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Configuração Local

Instale as dependências:

```bash
npm install
```

Aplique as migrations no Supabase:

```bash
supabase db push
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse a aplicação:

```text
http://localhost:3000
```

## Scripts Disponíveis

```bash
npm run dev
```

Inicia o servidor local de desenvolvimento.

```bash
npm run build
```

Gera a build de produção.

```bash
npm run start
```

Inicia o servidor de produção após uma build bem-sucedida.

```bash
npm run lint
```

Executa a validação com ESLint.

## Configuração do Supabase

Nas configurações de autenticação do Supabase, adicione a URL de callback local:

```text
http://localhost:3000/auth/callback
```

Em produção, adicione também a URL do domínio publicado:

```text
https://your-domain.com/auth/callback
```

Caso utilize login por link mágico, verifique se o envio de emails está habilitado e configurado corretamente no projeto Supabase.

## Modelo de Segurança

O QueueLess utiliza Row Level Security do Supabase.

Regras de acesso:

- Usuários autenticados podem gerenciar apenas o próprio perfil, suas entradas de fila e seu histórico de atendimentos.
- Usuários anônimos podem ler perfis públicos de estabelecimentos.
- Usuários anônimos podem ler entradas ativas da fila pública.
- O histórico de atendimentos é privado para o dono do estabelecimento.

Esse modelo permite a existência de uma tela pública de fila sem expor dados operacionais privados.

## Decisões Arquiteturais

### Validação de sessão no servidor

Rotas protegidas validam a sessão do Supabase no servidor usando Server Components do App Router. Isso impede que usuários não autenticados recebam dados da dashboard durante a renderização inicial.

### Módulos realtime no cliente

O comportamento realtime da fila e dos analytics é implementado em componentes cliente e hooks, pois as subscriptions do Supabase Realtime dependem do ciclo de vida do navegador.

### Separação por camada de serviço

As operações de negócio ficam isoladas em `src/services`. Os componentes de interface chamam serviços em vez de conter consultas diretamente, melhorando manutenção, reutilização e testabilidade.

### Tipagem forte do banco

As entidades do banco são representadas em `src/types/database.ts`, garantindo maior cobertura de TypeScript nas operações com Supabase e reduzindo erros de integração em tempo de execução.

## Checklist de Produção

Antes de publicar:

- Aplicar todas as migrations do Supabase.
- Confirmar que as políticas de RLS estão habilitadas.
- Configurar URLs de redirecionamento no Supabase Auth.
- Definir as variáveis de ambiente de produção.
- Executar `npm run lint`.
- Executar `npm run build`.
- Validar o comportamento realtime da fila pública.
- Validar a entrega de emails de autenticação.

## Status do Projeto

A implementação atual inclui a base completa da aplicação:

- Autenticação
- Dashboard protegida
- CRUD e ações operacionais da fila
- Tela pública em tempo real
- Métricas diárias
- Migrations do Supabase
- Interface responsiva em estilo SaaS
