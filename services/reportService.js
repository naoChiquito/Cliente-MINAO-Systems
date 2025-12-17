const {API_BASE_URL} = require ("../app/config");
async function getStudentReportHtml(userId, cursoId) {
    try {
        const url = `${API_BASE_URL}/report/student/${userId}/course/${cursoId}/view`;

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