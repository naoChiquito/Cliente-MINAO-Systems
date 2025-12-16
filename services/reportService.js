async function getStudentReportHtml(userId, cursoId) {
    try {
        const url = `http://localhost:5050/minao_systems/report/student/${userId}/course/${cursoId}/view`;

        const response = await fetch(url, {
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`Fallo ${response.status}: El servidor no pudo generar el reporte HTML.`);
        }

        const htmlContent = await response.text(); 
        
        return { 
            success: true, 
            data: htmlContent
        };

    } catch (err) {
        return { 
            success: false, 
            message: err.message || 'Error de conexión con el servicio de reportes.' 
        };
    }
}

module.exports = { getStudentReportHtml };