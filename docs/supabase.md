# Supabase Setup

ランキング保存とプレイヤー登録には Supabase REST API と Supabase Auth を使います。SDK は追加していません。

## Environment

ローカル実行では `server.js` が発表用 Supabase プロジェクトの publishable key を `/config.js` として配信します。別プロジェクトを使う場合は次の環境変数で上書きしてください。

```txt
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_RANKING_TABLE=rankings
SUPABASE_PROFILE_TABLE=profiles
```

## Auth

プレイヤーは最初にプレイヤー名とパスワードを登録します。同じプレイヤー名は `profiles.username` の primary key で拒否します。

Supabase Auth は email/password API を使うため、内部的には次の形式のメールアドレスを生成します。ユーザーはメールアドレスを入力しません。

```txt
u-${hex(utf8(username.toLowerCase()))}@dainagon.example.com
```

Supabase ダッシュボードで Auth の email confirmation をオフにしてください。オンのままだと、登録直後にセッションが返らずゲームを開始できません。

ブラウザはログインセッションを `localStorage` に保存します。同じ端末では再入力なしで継続でき、別ブラウザや別端末ではプレイヤー名とパスワードでログインできます。

## Database

Supabase SQL Editor で `supabase/schema.sql` を実行してください。

- `profiles.username`: アプリ上のプレイヤー ID。1-24 文字。
- `profiles.auth_user_id`: Supabase Auth の `auth.uid()`。
- `profiles.created_at`: 登録日時。
- `rankings.user_id`: スコア登録した Auth ユーザー。
- `rankings.player_name`: 表示用プレイヤー名。`profiles.username` を参照。
- `rankings.score`: ゲーム終了時の合計スコア。負のスコアもそのまま保存。
- `rankings.created_at`: 登録日時。

ランキング取得は `score desc, created_at asc` の順で上位10件です。`rankings.player_name` は unique なので、同じプレイヤーが再度スコア登録した場合は古い行を増やさず、既存のスコアを新しいスコアで更新します。

## Security

- ランキング閲覧は未ログインでも可能です。
- プレイヤー登録とスコア登録は Supabase Auth のログイン済みユーザーのみ可能です。
- RLS で `rankings.player_name` がログインユーザーの `profiles.username` と一致する場合だけ insert / update できます。
- `delete` はランキングには許可していません。
