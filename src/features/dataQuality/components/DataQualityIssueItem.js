import { StyleSheet, Text, View } from 'react-native'

import { getDataQualitySeverityTone } from '../dataQualityPresentation'

export default function DataQualityIssueItem({ issue }) {
    const tone = getDataQualitySeverityTone(issue.severity)

    return (
        <View
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Issue de qualidade. Tipo ${issue.subjectType}. Identificador ${issue.subjectId}. Código ${issue.code}. Severidade ${issue.severity}.`}
            style={styles.container}
        >
            <View style={styles.heading}>
                <Text style={styles.subjectType}>{issue.subjectType}</Text>
                <View style={[styles.badge, styles[`${tone}Badge`]]}>
                    <Text style={[styles.badgeText, styles[`${tone}Text`]]}>
                        {issue.severity}
                    </Text>
                </View>
            </View>
            <Text style={styles.label}>Código</Text>
            <Text selectable style={styles.code}>{issue.code}</Text>
            <Text style={styles.label}>Identificador do subject</Text>
            <Text selectable style={styles.subjectId}>{issue.subjectId}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        minHeight: 142,
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    heading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    subjectType: {
        flex: 1,
        marginRight: 12,
        color: '#092955',
        fontSize: 16,
        fontWeight: '700',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
    },
    infoBadge: { backgroundColor: '#E0F2FE', borderColor: '#0284C7' },
    errorBadge: { backgroundColor: '#FEE2E2', borderColor: '#B91C1C' },
    neutralBadge: { backgroundColor: '#F1F5F9', borderColor: '#64748B' },
    badgeText: { fontSize: 12, fontWeight: '700' },
    infoText: { color: '#075985' },
    errorText: { color: '#991B1B' },
    neutralText: { color: '#334155' },
    label: {
        marginTop: 6,
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },
    code: { marginTop: 2, color: '#0F172A', fontSize: 14, lineHeight: 20 },
    subjectId: { marginTop: 2, color: '#334155', fontSize: 13 },
})
