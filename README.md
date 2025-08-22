# ポモドーロタイマー

シンプルで使いやすいポモドーロテクニック専用のタイマーアプリです。作業と休憩の時間を効率的に管理し、生産性を向上させます。

## 🚀 機能

- **3つのセッションタイプ**: 作業、小休憩、長休憩
- **カスタマイズ可能な時間設定**: 作業時間、休憩時間、長休憩の間隔を自由に調整
- **自動セッション切り替え**: 作業完了後に自動で休憩セッションに移行
- **ダーク/ライトテーマ**: お好みのテーマで快適な使用体験
- **進捗管理**: 完了した作業セッション数を記録
- **直感的なUI**: シンプルで美しいデザイン

## 📱 対応プラットフォーム

- iOS (App Store)
- Android (Google Play Store)

## 🛠️ 技術スタック

- **フレームワーク**: React Native + Expo
- **言語**: TypeScript
- **状態管理**: React Hooks
- **ストレージ**: AsyncStorage
- **広告**: Google Mobile Ads (react-native-google-mobile-ads)
- **ビルド**: EAS Build

## 📦 インストール

### 開発環境

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/pomodoro-timer.git
cd pomodoro-timer

# 依存関係をインストール
yarn install

# 開発サーバーを起動
yarn start
```

### 本番環境

各プラットフォームのストアからダウンロードしてください。

## 🔧 設定

### 時間設定

- **作業時間**: 1分〜180分
- **小休憩**: 1分〜60分  
- **長休憩**: 1分〜120分
- **長休憩の間隔**: 1回〜12回の作業後に長休憩

### テーマ設定

- **ライトテーマ**: 明るく清潔なデザイン
- **ダークテーマ**: 目に優しい暗めのデザイン

## 💰 収益化

このアプリは以下の方法で収益化されています：

- **バナー広告**: タイマーページ下部にGoogle AdMob広告を表示
- **広告ID**: 開発環境ではテスト広告、本番環境では実際の広告を表示

### 広告収益について

- 広告収益はGoogle AdMobを通じて管理されます
- ユーザーのプライバシーを尊重し、非パーソナライズ広告を優先
- 広告の表示頻度は適切に制御されています

## 🚀 ビルドとデプロイ

### EASビルド

```bash
# EAS CLIをインストール
npm install -g eas-cli

# ログイン
eas login

# iOS開発ビルド
npx eas build --platform ios --profile development

# Android開発ビルド
npx eas build --platform android --profile development

# 本番ビルド
npx eas build --platform all --profile production
```

### ストア公開

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## 📄 ライセンス

### ソフトウェアライセンス

```
MIT License

Copyright (c) 2024 Wataru Masuda

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### サードパーティライセンス

このプロジェクトは以下のオープンソースライブラリを使用しています：

- **React Native**: Apache License 2.0
- **Expo**: MIT License
- **react-native-google-mobile-ads**: Apache License 2.0
- **@react-native-async-storage/async-storage**: MIT License

## 🤝 貢献

プロジェクトへの貢献を歓迎します！

### 貢献方法

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発ガイドライン

- TypeScriptの型安全性を保つ
- 既存のコードスタイルに従う
- テストを追加する（可能な場合）
- ドキュメントを更新する

## 📞 サポート

### 問題報告

バグや機能リクエストがある場合は、[GitHub Issues](https://github.com/yourusername/pomodoro-timer/issues)で報告してください。

### 連絡先

- **開発者**: Wataru Masuda
- **Email**: your.email@example.com
- **Website**: https://yourwebsite.com

## 🔮 今後の予定

- [ ] 通知機能の追加
- [ ] 統計・分析機能
- [ ] カスタムテーマ
- [ ] データエクスポート機能
- [ ] 複数デバイス間での同期

## 📊 統計

- **ダウンロード数**: [App Store/Play Storeの統計]
- **評価**: [平均評価]
- **レビュー数**: [総レビュー数]

## 🙏 謝辞

このアプリの開発にあたり、以下のコミュニティとツールに感謝いたします：

- React Nativeコミュニティ
- Expoチーム
- Google Mobile Adsチーム
- すべてのオープンソース貢献者

---

**ポモドーロタイマー** - 生産性を向上させるシンプルなタイマーアプリ

© 2024 Wataru Masuda. All rights reserved.
