# Kento raw

Pastefy 風の「テキストを貼り付けて raw リンクを作る」無料ペーストサービス。
ログイン不要・サーバーレス（静的サイト + Table API）で動作します。

## 機能
- テキスト / コードを貼り付けて **raw リンク** と **表示リンク** を即時発行
- 23 種類の言語選択とシンタックスハイライト（highlight.js, jsDelivr CDN）
- 限定公開（一覧に表示しない）オプション
- 表示ページ: raw を開く / raw リンクコピー / 内容コピー / ダウンロード / 折り返し切替 / 閲覧数
- トップページに「最近のペースト」一覧（公開ペーストのみ、最新 15 件）
- Ctrl(Cmd)+Enter で送信、Tab でインデント
- レスポンシブ（PC / スマホ）

## エントリーポイント
| パス | 説明 |
|---|---|
| `index.html` | 作成フォーム + 最近のペースト |
| `view.html?p={slug}` | ハイライト付き表示ページ |
| `raw.html?p={slug}` | プレーンテキスト表示（raw リンク） |

`?p=` には slug（8 文字英数字）または レコード UUID を指定可能。`?id={uuid}` も対応。

## データモデル（Table API: `tables/pastes`）
| フィールド | 型 | 説明 |
|---|---|---|
| id | text | システム生成 UUID |
| slug | text | URL 用短縮 ID（8 文字） |
| title | text | タイトル（空なら Untitled） |
| content | rich_text | 本文（最大 500KB） |
| language | text | 形式（plaintext, javascript, ...） |
| unlisted | bool | true なら一覧非表示 |
| views | number | 閲覧回数 |

データはサーバー側 DB に保存されます（ブラウザのローカルストレージには依存しない）。
- プレビュー環境: プレビュー用データストア
- 公開（Hosted Deploy）後: Cloudflare D1（ライブ DB）。**プレビューと公開後の DB は別物**で自動同期されません。

### データを消さないために
- 通常の Hosted Deploy（再デプロイ）は既存のテーブル・行を **削除しません**（テーブル/カラム追加のみ in-place 反映）。
- `rebuild_db` オプションは全データを削除するため **使用しない** こと。
- プレビューで作成したデータを公開サイトへ移したい場合は `HostedDbSyncFromPreview`（既存ライブ行は保持）を使う。

## 公開方法（無料）
1. エディタ右上の **Publish（公開）** タブを開く
2. **Hosted Deploy** を選択して公開（データベース付きで公開されます）
3. 表示された公開 URL（`https://xxxx.vip.gensparksite.com` など）を共有

公開後、raw リンクは `https://<公開URL>/raw.html?p=xxxxxxxx` の形式になります。
ファイルを編集しても、再度 Publish するまで公開サイトには反映されません。

## ファイル構成
```
index.html        トップ（作成 + 一覧）
view.html         表示ページ
raw.html          raw 表示
css/style.css     スタイル
js/api.js         Table API ヘルパー（共通）
js/main.js        トップページ処理
js/view.js        表示ページ処理
.tables/schema.json  pastes テーブルスキーマ
```

## 今後の拡張候補
- 有効期限（自動削除）・パスワード保護
- 編集 / 削除用トークン
- 1 件ごとの短縮 URL（`/p/xxxx`）はホスティング側のルーティングが必要
