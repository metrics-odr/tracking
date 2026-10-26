# 07 · LGPD e consentimento

Este projeto envia dados pessoais (hasheados) a terceiros. Antes de produção:

1. **Base legal e aviso**: consentimento ou outra base válida, descrito na política de privacidade.
2. **CMP** (banner) integrado ao **Google Consent Mode v2**: `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`.
3. **Respeite a negativa**: sem `ad_user_data`/`ad_storage`, não envie `user_data` à Meta (no sGTM, condicione a tag CAPI ao consentimento: *Additional Consent Checks*).
4. **Minimização**: envie só o que a finalidade exige; não colete dados sensíveis (saúde, religião etc.) em `custom_data`.
5. **Hash não é anonimização** — continua sendo dado pessoal.
6. **Retenção/Direitos**: se armazenar `user_data` no servidor (Firestore), defina TTL e processo de exclusão.
7. Para o público do Brasil, avalie `data_processing_options` apenas quando aplicável (LDU é voltado a leis dos EUA).

> Isto é orientação técnica, não aconselhamento jurídico.
