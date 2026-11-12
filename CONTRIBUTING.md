# Contribuindo com o LokalBan

Que bom ter você aqui! 🎉 Este projeto existe para a comunidade trocar experiência de verdade —
então contribuir **não é só escrever código**.

## Formas de contribuir

| Você tem... | Como ajudar |
|---|---|
| 5 minutos | Dar ⭐, testar a última release, reportar um bug |
| Olho de design | Sugerir melhorias de UI/UX, animações, acessibilidade (abra uma Discussion com prints) |
| Anos de estrada | Revisar PRs, comentar decisões de arquitetura, mentorar quem está começando |
| Uma tarde livre | Pegar uma issue `good first issue` ou um item do Roadmap no README |
| Vontade de aprender | Escolher uma issue `help wanted` e perguntar à vontade — dúvida não é incômodo |

## Antes de começar

1. **Procure** nas [issues](../../issues) e [discussions](../../discussions) se o assunto já existe.
2. Para mudanças grandes (novas features, refatorações, troca de biblioteca), **abra uma issue ou
   discussion primeiro**. Alinhar antes evita retrabalho e PR recusado.
3. Comente na issue que vai pegá-la, para ninguém fazer em dobro.

## Ambiente de desenvolvimento

Veja a seção **Desenvolvimento** do [README](README.md). Resumo:

```bash
git clone https://github.com/<seu-usuario>/lokalban.git C:\dev\lokalban
cd C:\dev\lokalban
npm install
npm run tauri dev
```

## Fluxo de trabalho

1. Faça um **fork** e crie uma branch a partir da `main`:
   `feat/prioridade-nos-cards`, `fix/arrasto-coluna-vazia`, `docs/readme-atalhos`
2. Commits pequenos, no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
   ```
   feat: adiciona prioridade aos cards
   fix: corrige posição do card ao arrastar com scroll
   docs: explica o board.json no README
   refactor(storage): extrai validação do quadro
   ```
3. Antes de abrir o PR, rode:
   ```bash
   npm run build                                  # typecheck + build
   npm run format                                 # Prettier
   cargo fmt --manifest-path src-tauri/Cargo.toml
   cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
   ```
4. Abra o **Pull Request** preenchendo o template. Prints ou GIFs ajudam muito em mudanças visuais.
5. Um mantenedor vai revisar. Discussão no PR é normal e saudável — é onde a troca acontece.

## Padrões do código

- **TypeScript** em modo `strict`; sem `any` sem justificativa.
- **Componentes** pequenos em `src/components/`, lógica de estado em `src/hooks/`.
- **Estilo** com Tailwind; cores e medidas reutilizáveis viram tokens em `src/index.css`.
- **Textos da interface** em português (pt-BR) por enquanto.
- **Rust**: `cargo fmt` + `clippy` limpos; erros devolvidos como `Result<_, String>` para o frontend.
- **Dados do usuário são sagrados**: qualquer mudança no formato do `board.json` precisa de
  migração do formato antigo (veja `parseBoard` em `src/hooks/useBoard.ts`).

## Reportando bugs

Use o template de bug e inclua: versão do LokalBan, versão do Windows, passos para reproduzir,
o que esperava e o que aconteceu. Se envolver dados, **não anexe seu `board.json` real** —
recorte só o trecho necessário.

## Código de conduta

Ao participar você concorda com o [Código de Conduta](CODE_OF_CONDUCT.md). Resumindo:
respeito, paciência com quem está começando e crítica ao código, nunca à pessoa.

Obrigado por somar! 💜
