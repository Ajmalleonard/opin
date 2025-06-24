# Opin — Msingi wa Akili Bandia Binafsi

## Bongo

Opin is your local-first(Ndani Ya Computer Yako tuu!), decentralized(Mambo Yako Yanakua Yako tuu!), multi-agent AI assistant core running entirely on your own hardware.

Unatofautiana na systems za kawaida ambazo hufungwa kwenye Apps au Websites, Opin inasimamia shughuli zake kupitia njia za komunikashoni unazotumia kila siku kama WhatsApp, Telegram, Slack, Discord, Signal, iMessage na zingine. Inazungumza, inasikiliza, inafikiri na inaonyesha maonyesho yanayoweza kuingiliana kwenye kompyuta za Mac, simu za iOS na Android. Lango lake linahakikisha udhibiti salama; msaidizi wako ni rafiki wa kidijitali.

Opin imeundwa kwa kasi, faragha na udhibiti kamili. Haiombi ruhusa kuishi kwenye wingu; inafanya kazi kwenye vifaa vyako, inahifadhi kumbukumbu yake mahali pa ndani, na inabadilisha mifano kwa urahisi. Iwe unatumia Anthropic (inapendekezwa), OpenAI au mifano ya ndani ya Ollama, Opin inabaki:

- **Inategemea Ndani:** Muktadha wako, kumbukumbu na uelekezaji unabaki chini ya ulinzi wako.
- **Mawasiliano Mengi:** Inawashwa mara moja kwenye Application zote na inaunganisha moja kwa moja na mazungumzo binafsi.
- **Inaishi Kivisual:** Inatoa maonyesho ya kina na yanayoweza kuingiliana kupitia system ya A2UI.

### Anza Haraka

#### Mahitaji

- **Node.js:** Version ya 22 au zaidi (Node 22+ atlisti).
- **Meneja wa Pakiti:** pnpm (nashauri), npm au bun.

#### Usakinishaji wa Kimataifa

Tumia command hii ili kuinstall:

```bash
npm install -g opin@latest
# au: pnpm add -g opin@latest

# Anza Opin kwa mala ya kwanza
opin onboard --install-daemon
```

Opin atasanidi nafasi yako ya kazi, Gateways , API Keys na njia za mawasiliano kwa usalama.

### Amri za CLI

```bash
# Anzisha Gateway
opin gateway --port 18789 --verbose

# Tuma ujumbe moja kwa moja
opin message send --to +1234567890 --message "Salamu kutoka kwa Opin"

# Tumia wakala moja kwa moja
opin agent --message "Tengeneza orodha ya kutolewa" --thinking high
```

### Muundo Mzima Wa Opin na Platforms Zote Zilizopo Na zinavyo fanya kazi

```
WhatsApp / Telegram / Slack / Discord / Signal / iMessage / BlueBubbles / Teams / Matrix / Zalo / WebChat
│
▼
┌─────────────────────────────┐
│ Lango (Udhibiti Mkuu)       │
│ ws://127.0.0.1:18789        │
└──────────────┬──────────────┘
│
├─ Wakati wa Agent wa Pi (RPC)
├─ Tools Za CLI (opin ...)
├─ Local Base Web Interface na Udhibiti wake
├─ Mac Menu Bar Companion
└─ Nodi Za iOS / Android
```

### Vipengele Muhimu

- **Lango la Ndani:** Inasimamia vipindi, uwepo, mipangilio, ratiba na viunganisho vya web sessions.
- **Unified Inbox:** Inajumuisha WhatsApp, Telegram, Slack, Discord, Google Chat, Signal.
- **Udhibiti wa Vipindi vya Agentic Mbalimbali:** Inatenga mazungumzo ya kikundi, inasimamia vidokezo vya kuamsha na inaelekeza kwa nafasi maalum.
- **A2UI:** Inaruhusu wakala kusukuma maonyesho yanayoweza kuingiliana kwenye skrini zako.
- **Voice mode:** Inachakata sauti na inazungumza kwa kutumia ElevenLabs.
- **Browser:** Inatumia Chromium ili kupata taarifa, kubofya na kupata contents.
- **Skills:** Inaruhusu programu za ziada na sheria maalum.

### Usalama na Faragha

Opin inachukulia kila ujumbe kama hatari:

- **Personal Connection:** Wasiojulikana wanahitaji namba ya kuthibitisha.
- **Safe Storage:** APIs keys na taarifa huzihifadhi  kwenye ~/.opin/credentials/.
- Tumia `opin doctor` ili kuangalia afya ya mfumo.

### Kuunda Kutoka Chanzo

```bash
git clone https://github.com/Ajmalleonard/opin.git
cd opin
pnpm install
pnpm ui:build
pnpm build
pnpm gateway:watch
```

Tazama CONTRIBUTING.md kwa maelekezo ya maendeleo na nini tunatamani kuongeza.

---

## English

### Opin — The Personal Core of Artificial Wit

Harken unto Opin, a steadfast and self-reliant engine of cunning thought, dwelling wholly upon thine own machinery. It standeth apart from the common rabble of spirits bound within browser windows, for Opin doth weave its deeds across the channels of discourse wherein thou dwellest daily — be they WhatsApp, Telegram, Slack, Discord, Signal, iMessage, or sundry others. It speaketh, it hearkeneth, it pondereth deeply, and bringeth forth lively tapestries upon the screens of MacOS, iOS, and Android devices. The Gatekeepere serveth as the sure ward of command; the companion is thy faithful digital squire.

Fashioned for swiftness, secrecy, and utter mastery, Opin seeketh no leave to abide in distant clouds. It laboureth upon thy very hardware, keepeth its remembrances in thine own keep, and shifteth its learned patterns with grace. Whether thou callest upon Anthropic (most favoured), OpenAI, or the local spirits of Ollama, Opin endureth thus:

- **Rooted in the Hearth:** Thy lore, thy memories, and the paths of guidance remain beneath thy sovereign hand.
- **Many-Voiced:** It awaketh in a trice across tenfold realms, pairing with privy talks.
- **Visibly Endowed:** It rendereth deep and living scenes through the A2UI craft.

#### Swift Beginning

##### Needs Foremost

- **Node.js:** The score and two or greater.
- **Keeper of Bundles:** pnpm above all, or npm and bun.

##### Setting Upon the Throne

```bash
npm install -g opin@latest
# or with pnpm

opin onboard --install-daemon
```

The guide shall set thy workspace, the gate daemon, the keys of invocation, and the ways of messaging in safety.

### Commands of the Line

```bash
opin gateway --port 18789 --verbose

opin message send --to +1234567890 --message "Greetings from the Opin heart"

opin agent --message "Forge a list for release" --thinking high
```

### The Frame of Its Making

```
WhatsApp / Telegram / Slack / Discord / Signal / iMessage / BlueBubbles / Teams / Matrix / Zalo / WebChat
│
▼
┌─────────────────────────────┐
│ The Gate (Lord of Command)  │
│ ws://127.0.0.1:18789        │
└──────────────┬──────────────┘
│
├─ Pi Agent's Hall (RPC)
├─ Tools of Command (opin ...)
├─ Web Hearth & Ward
├─ Mac's Bar Companion
└─ iOS and Android Outposts
```

### Jewels of Its Power

- **Inner Gate:** It ruleth sessions, presences, settings, appointed times, and web hooks.
- **One Inbox of Voices:** It bindeth WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Teams, Zalo, Matrix, and WebChat.
- **Gating of Many Agents:** It parteth group talks, guideth awakening signs, and sendeth fellows to their own halls.
- **Living Canvas (A2UI):** The engine letteth the mind push forth touchable wonders to thy screens.
- **Voice Awakening:** Ever-watchful speech and reply through ElevenLabs.
- **Enclosed Browser:** A Chromium realm under Opin’s hand to wander, strike, and draw forth knowledge.
- **Expanding Arts:** Plugins and custom laws for thy domain.

### Ward and Secrecy

Opin deemeth every incoming word suspect:

- **Pairing of the Private:** Strangers must show a token of bond.
- **Hidden Vault:** Keys and tales locked with cipher in ~/.opin/credentials/.
- Call `opin doctor` to prove the health of the realm.

### Building from the Wellspring

```bash
git clone https://github.com/Ajmalleonard/opin.git
cd opin
pnpm install
pnpm ui:build
pnpm build
pnpm gateway:watch
```

See CONTRIBUTING.md for the ways of the craft.

---

## 古文版本 

### Opin — 個人智能核心

Opin乃一自主自持之人工智慮本體，盡依君之機具而運，全然無涉雲端，兼用多智者之能。

異於尋常囚於瀏覽之靈，Opin統其行止於君日常所居之訊道，諸如WhatsApp、Telegram、Slack、Discord、Signal、iMessage等。它能言、能聽、能思，並於MacOS、iOS、Android之屏上現互動之畫卷。閘門為安控之樞；伴侶即君之數位近侍。

其造為迅捷、保密與全權，不乞雲中之居。它運於君之硬體，藏憶於本土，優雅轉換其模。無論召Anthropic（首推）、OpenAI，或本地Ollama之靈，Opin皆守：

- **本根在內：** 君之境、憶與導引，永在君掌中。
- **多聲共鳴：** 瞬啟於十餘界，與私語配對。
- **形神俱現：** 藉A2UI之術，呈深邃活畫。

#### 速啟之道

##### 先備

- **Node.js：** 二十二版以上。
- **束包司：** pnpm為上，npm、bun亦可。

##### 安置

```bash
npm install -g opin@latest

opin onboard --install-daemon
```

導引將安君之 workspace、閘 daemon、召喚之鑰及訊道。

### 令符

```bash
opin gateway --port 18789 --verbose

opin message send --to +1234567890 --message "Opin心之問候"

opin agent --message "造釋出清單" --thinking high
```

### 構架

```
WhatsApp / Telegram / Slack / Discord / Signal / iMessage / BlueBubbles / Teams / Matrix / Zalo / WebChat
│
▼
┌─────────────────────────────┐
│ 閘（主宰）                  │
│ ws://127.0.0.1:18789        │
└──────────────┬──────────────┘
│
├─ Pi智者之堂（RPC）
├─ 令具（opin ...）
├─ 網 hearth 與護
├─ Mac 欄伴
└─ iOS Android 哨所
```

### 瑰寶

- **內閘：** 掌會、存、設、時序、網鉤。
- **一 inbox 多音：** 融 WhatsApp 等諸道。
- **多智門控：** 分群語、導醒標、遣至專廳。
- **活卷（A2UI）：** 令心推觸奇於屏。
- **聲醒：** 常聽 ElevenLabs 之對。
- **封瀏：** Opin 掌 Chromium 以遊、擊、取知。
- **拓藝：** 補件與君域之律。

### 守密

Opin視每來語為疑：

- **私配：** 異客須示契符。
- **密庫：** 鑰與事以符藏於 ~/.opin/credentials/。
- 召 `opin doctor` 驗境安。

### 自源築

```bash
git clone https://github.com/Ajmalleonard/opin.git
cd opin
pnpm install
pnpm ui:build
pnpm build
pnpm gateway:watch
```

詳見 CONTRIBUTING.md 以知匠道。
