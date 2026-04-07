export const convertToCsvFile = (dataList) => {
    const headers = [
        'placa',
        'modelo',
        'ano',
        'cliente_identificador',
        'cliente_nome',
        'cliente_telefone',
        'cliente_endereco',
        'mensalista',
        'valor_mensalidade'
    ];

    const csvRows = dataList.map(row => {
        return headers.map(fieldName => {
            const value = row[fieldName] || '';
            const stringValue = String(value);

            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                const escaped = stringValue.replace(/"/g, '""');
                return `"${escaped}"`;
            }
            return stringValue;
        }).join(',');
    });

    const csvString = [headers.join(','), ...csvRows].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    return new File([blob], 'corrigido.csv', { type: 'text/csv' });
};