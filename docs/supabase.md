# Supabase Setup

ランキング保存には Supabase の REST API を使います。SDK は追加していません。

## Environment

`.env.example` を参考に、実行環境に次の値を設定してください。

```txt
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_RANKING_TABLE=rankings
```

環境変数が未設定の場合、`BackendApi` はモックランキングを使います。

## Database

Supabase の SQL Editor で `supabase/schema.sql` を実行してください。

ランキングの保存仕様:

- `player_name`: プレイヤー名
- `score`: ゲーム終了時の合計スコア。負のスコアも負のまま保存する。
- `created_at`: 登録日時

ランキング取得は `score desc, created_at asc` の順で上位10件です。

## Security

発表用のスコアアタックなので、匿名ユーザーの `select` と `insert` を許可しています。
`update` と `delete` は許可していません。
