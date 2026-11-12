# Política de Segurança

## Versões suportadas

Apenas a versão mais recente publicada em [Releases](../../releases) recebe correções.

## Como reportar uma vulnerabilidade

**Não abra uma issue pública.** Use o reporte privado do GitHub:
aba **Security → Report a vulnerability** neste repositório.

Inclua o máximo de detalhes possível (passos, impacto, versão). Você receberá uma resposta
assim que um mantenedor analisar o caso.

## Escopo

O LokalBan roda 100% offline e só grava arquivos em `%APPDATA%\com.lokalban.widget\`.
São especialmente relevantes: execução de código a partir do `board.json`, escrita fora da
pasta de dados, e permissões excessivas em `src-tauri/capabilities/`.
