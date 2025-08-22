import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// EASビルドや本番環境でのみ広告ライブラリをインポート
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

if (Constants.appOwnership !== 'expo') {
  try {
    const adsModule = require('react-native-google-mobile-ads');
    BannerAd = adsModule.BannerAd;
    BannerAdSize = adsModule.BannerAdSize;
    TestIds = adsModule.TestIds;
  } catch (error) {
    console.log('Ad library not available:', error);
  }
}

type SessionType = 'work' | 'short' | 'long';
type ThemeMode = 'light' | 'dark';

type PomodoroSettings = {
  workMinutes: number; // 1〜180
  shortBreakMinutes: number; // 1〜60
  longBreakMinutes: number; // 1〜120
  longBreakInterval: number; // 1〜12
  theme: ThemeMode;
};

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  theme: 'dark',
};

const STORAGE_KEY = 'pomodoro_settings_v1';

type ThemeColors = {
  background: string;
  surface: string;
  muted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentText: string;
};

const DARK_COLORS: ThemeColors = {
  background: '#0B0F14',
  surface: '#0F1621',
  muted: '#111827',
  border: '#1E293B',
  textPrimary: '#E5E7EB',
  textSecondary: '#9CA3AF',
  accent: '#22D3EE',
  accentText: '#FFFFFF',
};

const LIGHT_COLORS: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  muted: '#F3F4F6',
  border: '#E5E7EB',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  accent: '#0891B2',
  accentText: '#FFFFFF',
};

// Default colors for static StyleSheet. Dynamic theme overrides at render-time.
const COLORS: ThemeColors = DARK_COLORS;

export default function App() {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const [currentSession, setCurrentSession] = useState<SessionType>('work');
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0);

  const initialRemainingMs = useMemo(() => minutesToMs(getSessionMinutes('work', settings)), [settings]);
  const [remainingMs, setRemainingMs] = useState<number>(initialRemainingMs);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickEpochRef = useRef<number | null>(null);

  // Load settings from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PomodoroSettings;
          const merged = sanitizeSettings(parsed);
          setSettings(merged);
          // Reset timer with loaded settings
          setCurrentSession('work');
          setCompletedWorkSessions(0);
          setRemainingMs(minutesToMs(getSessionMinutes('work', merged)));
          setIsRunning(false);
        }
      } catch (_) {
        // ignore
      }
    })();
  }, []);

  // When session or settings change while stopped, reset remaining time
  useEffect(() => {
    if (!isRunning) {
      setRemainingMs(minutesToMs(getSessionMinutes(currentSession, settings)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession, settings.workMinutes, settings.shortBreakMinutes, settings.longBreakMinutes]);

  const colors: ThemeColors = useMemo(
    () => (settings.theme === 'light' ? LIGHT_COLORS : DARK_COLORS),
    [settings.theme]
  );

  // Timer effect
  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      lastTickEpochRef.current = null;
      return;
    }

    if (intervalRef.current) return; // already running

    lastTickEpochRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const last = lastTickEpochRef.current ?? now;
      const diff = now - last;
      lastTickEpochRef.current = now;

      setRemainingMs(prev => {
        const next = Math.max(0, prev - diff);
        if (next <= 0) {
          // complete
          requestAnimationFrame(() => {
            onCompleteSession();
          });
        }
        return next;
      });
    }, 250);

    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function onCompleteSession() {
    clearTimer();
    setIsRunning(false);

    if (currentSession === 'work') {
      const nextCompleted = completedWorkSessions + 1;
      setCompletedWorkSessions(nextCompleted);
      const shouldLong = nextCompleted % settings.longBreakInterval === 0;
      const nextType: SessionType = shouldLong ? 'long' : 'short';
      setCurrentSession(nextType);
      setRemainingMs(minutesToMs(getSessionMinutes(nextType, settings)));
      setIsRunning(true); // auto start next
    } else {
      setCurrentSession('work');
      setRemainingMs(minutesToMs(getSessionMinutes('work', settings)));
      setIsRunning(true); // auto start next
    }
  }

  function minutesToMs(min: number) {
    return Math.max(0, Math.round(min)) * 60 * 1000;
  }

  function getSessionMinutes(type: SessionType, s: PomodoroSettings) {
    switch (type) {
      case 'work':
        return s.workMinutes;
      case 'short':
        return s.shortBreakMinutes;
      case 'long':
        return s.longBreakMinutes;
    }
  }

  function formatTime(ms: number) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function handleStartPause() {
    setIsRunning(prev => !prev);
  }

  function handleReset() {
    clearTimer();
    setIsRunning(false);
    setRemainingMs(minutesToMs(getSessionMinutes(currentSession, settings)));
  }

  function handleSkip() {
    clearTimer();
    setIsRunning(false);
    
    // スキップ時は自動開始しない
    if (currentSession === 'work') {
      const nextCompleted = completedWorkSessions + 1;
      setCompletedWorkSessions(nextCompleted);
      const shouldLong = nextCompleted % settings.longBreakInterval === 0;
      const nextType: SessionType = shouldLong ? 'long' : 'short';
      setCurrentSession(nextType);
      setRemainingMs(minutesToMs(getSessionMinutes(nextType, settings)));
    } else {
      setCurrentSession('work');
      setRemainingMs(minutesToMs(getSessionMinutes('work', settings)));
    }
  }

  function setSession(type: SessionType) {
    clearTimer();
    setIsRunning(false);
    setCurrentSession(type);
    setRemainingMs(minutesToMs(getSessionMinutes(type, settings)));
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={settings.theme === 'light' ? 'dark' : 'light'} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>ポモドーロタイマー</Text>
        <Pressable
          onPress={() => setSettingsVisible(true)}
          android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: false }}
          style={({ pressed }) => [
            styles.settingsButton,
            { borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.settingsButtonText, { color: colors.textPrimary }]}>設定</Text>
        </Pressable>
      </View>

      <View style={styles.sessionTabs}>
        <TabButton label="作業" active={currentSession === 'work'} onPress={() => setSession('work')} colors={colors} />
        <TabButton label="小休憩" active={currentSession === 'short'} onPress={() => setSession('short')} colors={colors} />
        <TabButton label="長休憩" active={currentSession === 'long'} onPress={() => setSession('long')} colors={colors} />
      </View>

      <View style={styles.timerBox}>
        <View style={[styles.timerRing, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={[styles.timerInner, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text
              style={[styles.timeText, { color: colors.textPrimary, width: '90%', textAlign: 'center' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              allowFontScaling={false}
            >
              {formatTime(remainingMs)}
            </Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>
              {currentSession === 'work' ? '集中しましょう' : currentSession === 'short' ? 'ひと休み' : 'しっかり休憩'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.controls}>
          <PrimaryButton title={isRunning ? '一時停止' : '開始'} onPress={handleStartPause} style={styles.controlGrow} colors={colors} />
          <SecondaryButton title="リセット" onPress={handleReset} colors={colors} />
          <SecondaryButton title="スキップ" onPress={handleSkip} colors={colors} />
        </View>

        <Text style={[styles.counterText, { color: colors.textSecondary }]}>完了した作業: {completedWorkSessions}</Text>

        {/* 広告表示領域を常に確保 */}
        <View style={styles.adContainer}>
          {Constants.appOwnership !== 'expo' && BannerAd ? (
            <BannerAd
              unitId={TestIds?.BANNER || 'test-banner-id'}
              size={BannerAdSize?.BANNER || 'BANNER'}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
            />
          ) : (
            <View style={styles.adPlaceholder }>
              <Text style={[styles.adPlaceholderText, { color: colors.textSecondary }]}>
                広告エリア
              </Text>
            </View>
          )}
        </View>
      </View>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        settings={settings}
        colors={colors}
        onSave={async (next) => {
          const sanitized = sanitizeSettings(next);
          setSettings(sanitized);
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
          } catch (_) {
            // ignore
          }
          setSettingsVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

function sanitizeSettings(input: PomodoroSettings): PomodoroSettings {
  const clamp = (n: number, min: number, max: number) => {
    const num = Number.isFinite(n) ? Math.round(n) : 0;
    return Math.min(max, Math.max(min, num));
  };
  return {
    workMinutes: clamp(input.workMinutes, 1, 180),
    shortBreakMinutes: clamp(input.shortBreakMinutes, 1, 60),
    longBreakMinutes: clamp(input.longBreakMinutes, 1, 120),
    longBreakInterval: clamp(input.longBreakInterval, 1, 12),
    theme: input.theme === 'light' ? 'light' : 'dark',
  };
}

function TabButton({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: ThemeColors }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={({ pressed }) => [
        styles.tabButton,
        { backgroundColor: colors.muted, borderColor: colors.border },
        active && { backgroundColor: colors.accent, borderColor: colors.accent },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.tabButtonText,
          { color: active ? colors.accentText : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  testID,
  colors,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  testID?: string;
  colors: ThemeColors;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.fieldRight}>
        <TextInput
          testID={testID}
          style={[
            styles.numberInput,
            { borderColor: colors.border, backgroundColor: colors.muted, color: colors.textPrimary },
          ]}
          value={text}
          onChangeText={(t) => {
            const digits = t.replace(/[^0-9]/g, '');
            setText(digits);
            if (digits !== '') {
              const n = parseInt(digits, 10);
              onChange(Number.isFinite(n) ? n : value);
            }
          }}
          onEndEditing={() => {
            // 空のまま保存された場合は現在の値に戻す
            if (text === '') {
              setText(String(value));
            } else {
              const n = parseInt(text, 10);
              onChange(Number.isFinite(n) ? n : value);
            }
          }}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={3}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
        />
        {suffix ? <Text style={[styles.fieldSuffix, { color: colors.textSecondary }]}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function SettingsModal({
  visible,
  onClose,
  settings,
  onSave,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  settings: PomodoroSettings;
  onSave: (s: PomodoroSettings) => void | Promise<void>;
  colors: ThemeColors;
}) {
  const [local, setLocal] = useState<PomodoroSettings>(settings);

  useEffect(() => setLocal(settings), [settings, visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>設定</Text>
          <Pressable
            onPress={onClose}
            android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
            style={({ pressed }) => [
              styles.modalClose,
              { borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.modalCloseText, { color: colors.textPrimary }]}>閉じる</Text>
          </Pressable>
        </View>

        <View style={styles.fields}>
          <NumberField label="作業時間" value={local.workMinutes} onChange={(n) => setLocal((p) => ({ ...p, workMinutes: n }))} suffix="分" testID="work-min" colors={colors} />
          <NumberField label="小休憩" value={local.shortBreakMinutes} onChange={(n) => setLocal((p) => ({ ...p, shortBreakMinutes: n }))} suffix="分" testID="short-min" colors={colors} />
          <NumberField label="長休憩" value={local.longBreakMinutes} onChange={(n) => setLocal((p) => ({ ...p, longBreakMinutes: n }))} suffix="分" testID="long-min" colors={colors} />
          <NumberField label="長休憩の間隔" value={local.longBreakInterval} onChange={(n) => setLocal((p) => ({ ...p, longBreakInterval: n }))} suffix="回の作業" testID="interval" colors={colors} />

          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>テーマ</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setLocal({ ...local, theme: 'light' })}
                style={({ pressed }) => [
                  styles.themeChip,
                  { borderColor: colors.border, backgroundColor: local.theme === 'light' ? colors.accent : 'transparent' },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={{ color: local.theme === 'light' ? colors.accentText : colors.textSecondary }}>ライト</Text>
              </Pressable>
              <Pressable
                onPress={() => setLocal({ ...local, theme: 'dark' })}
                style={({ pressed }) => [
                  styles.themeChip,
                  { borderColor: colors.border, backgroundColor: local.theme === 'dark' ? colors.accent : 'transparent' },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={{ color: local.theme === 'dark' ? colors.accentText : colors.textSecondary }}>ダーク</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.modalActions}>
          <PrimaryButton onPress={() => onSave(local)} colors={colors} style={{ height: 50 }} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function PrimaryButton({ title, onPress, style, colors }: { title?: string; onPress: () => void; style?: any; colors: ThemeColors }) {
  const label = (title || '').trim() || '保存';
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(34,211,238,0.2)' }}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: colors.accent },
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.primaryButtonText, { color: colors.accentText }]}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ title, onPress, style, colors }: { title: string; onPress: () => void; style?: any; colors: ThemeColors }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
      style={({ pressed }) => [
        styles.secondaryButton,
        { borderColor: colors.border },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  settingsButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsButtonText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  sessionTabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: COLORS.muted,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  tabButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabButtonTextActive: {
    color: COLORS.accentText,
  },
  timerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    minHeight: 400,
  },
  timerRing: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  timerInner: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.muted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeText: {
    fontSize: 88,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subText: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  controlGrow: { flex: 1.3 },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: COLORS.accentText,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.6,
    fontSize: 14,
  },
  pressed: { opacity: 0.9 },
  counterText: {
    textAlign: 'center',
    marginBottom: 16,
    color: COLORS.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalClose: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCloseText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  fields: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  fieldLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  fieldRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberInput: {
    width: 90,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.muted,
    color: COLORS.textPrimary,
    borderRadius: 999,
    paddingHorizontal: 14,
    fontSize: 16,
    textAlign: 'right',
  },
  fieldSuffix: {
    marginLeft: 8,
    color: COLORS.textSecondary,
  },
  modalActions: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    height: 70,
  },
  themeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  adContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  adPlaceholder: {
    width: 320,
    height: 50,
    backgroundColor: COLORS.muted,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    opacity: 0,
  },
  adPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
