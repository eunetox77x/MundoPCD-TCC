// Script para carregar dinamicamente os cursos na página de cursos
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estamos na página de cursos
    const coursesContainer = document.getElementById('courses-container');
    if (coursesContainer) {
        // Dados simulados de cursos que viriam do backend
        const courses = [
            {
                id: 1,
                title: 'Excel Básico',
                type: 'excel',
                icon: 'X',
                online: true,
                duration: '60 horas',
                certificate: true,
                price: 'R$ 25,00',
                rating: 4,
                reviews: 10
            },
            {
                id: 2,
                title: 'Word Intermediário',
                type: 'word',
                icon: 'DOC',
                online: true,
                duration: '60 horas',
                certificate: true,
                price: 'R$ 25,00',
                rating: 4,
                reviews: 0
            },
            {
                id: 3,
                title: 'PowerPoint Avançado',
                type: 'powerpoint',
                icon: 'PPT',
                online: true,
                duration: '60 horas',
                certificate: true,
                price: 'R$ 25,00',
                rating: 4,
                reviews: 0
            }
        ];

        // Gera HTML para cada curso
        courses.forEach(course => {
            const courseHTML = `
                <div class="course-card ${course.type}">
                    <div class="course-icon">
                        ${course.icon}
                    </div>
                    <div class="course-info">
                        <h3 class="course-title">${course.title}</h3>
                        <div class="course-details">
                            <div class="course-detail">
                                <span>${course.online ? 'Online' : 'Presencial'}</span>
                            </div>
                            <div class="course-detail">
                                <span>Duração: ${course.duration}</span>
                            </div>
                            <div class="course-detail">
                                <span>Certificado garantido</span>
                            </div>
                        </div>
                        <div class="course-price">${course.price}</div>
                        <div class="rating">
                            ${getRatingStars(course.rating)}
                            <span>(${course.reviews} avaliações)</span>
                        </div>
                    </div>
                </div>
            `;
            coursesContainer.innerHTML += courseHTML;
        });
    }

    // Verifica se estamos na página de vagas
    const jobsContainer = document.getElementById('jobs-container');
    if (jobsContainer) {
        // Dados simulados de vagas que viriam do backend
        const jobs = [
            {
                id: 1,
                title: 'Estágio em Administração',
                company: 'Senai',
                location: 'Feira de Santana - BA',
                type: 'Presencial'
            },
            {
                id: 2,
                title: 'Telemarketing',
                company: 'TELL',
                location: 'Feira de Santana - BA',
                type: 'Presencial'
            },
            {
                id: 3,
                title: 'Auxiliar de Produção',
                company: 'Vipal Borrachas',
                location: 'Feira de Santana - BA',
                type: 'Presencial'
            }
        ];

        // Gera HTML para cada vaga
        jobs.forEach(job => {
            const jobHTML = `
                <div class="job-card">
                    <h3 class="job-title">${job.title}</h3>
                    <div class="job-company">
                        <span>${job.company}</span>
                    </div>
                    <div class="job-location">
                        <span>${job.location}</span>
                    </div>
                    <div class="job-type">
                        <span>${job.type}</span>
                    </div>
                </div>
            `;
            jobsContainer.innerHTML += jobHTML;
        });
    }
});

// Função para gerar as estrelas de avaliação
function getRatingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<span class="star">★</span>';
        } else {
            stars += '<span class="star">☆</span>';
        }
    }
    return stars;
}