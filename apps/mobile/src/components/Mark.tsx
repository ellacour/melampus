/**
 * Brand mark mobile — plaque arrondie + tracé ECG-M.
 * Single source of visual truth pour le logo dans l'app mobile.
 *
 * Note : utilise react-native-svg, qui est inclus de base dans Expo SDK 52.
 */
import Svg, { Path, Rect } from 'react-native-svg'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../theme'

interface MarkProps {
  size?: number
  variant?: 'on-paper' | 'on-deep' | 'on-ink'
  withWordmark?: boolean
}

export function Mark({ size = 36, variant = 'on-paper', withWordmark = false }: MarkProps) {
  const cfg = {
    'on-paper': { bg: colors.brand, stroke: colors.paper, word: colors.ink },
    'on-deep': { bg: colors.paper, stroke: colors.brand, word: colors.paper },
    'on-ink': { bg: colors.ink, stroke: colors.paper, word: colors.paper },
  }[variant]

  return (
    <View style={styles.row}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Rect x={0} y={0} width={64} height={64} rx={14} ry={14} fill={cfg.bg} />
        <Path
          d="M8 42 L22 42 L26 18 L32 42 L38 18 L42 42 L56 42"
          fill="none"
          stroke={cfg.stroke}
          strokeWidth={3}
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </Svg>
      {withWordmark && (
        <Text
          style={[
            styles.wordmark,
            { color: cfg.word, fontSize: Math.round(size * 0.55) },
          ]}
        >
          mélampus
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontWeight: '600', letterSpacing: -0.5, lineHeight: undefined },
})
