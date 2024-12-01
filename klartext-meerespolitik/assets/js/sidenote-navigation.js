document.addEventListener('DOMContentLoaded', function () {

    let mos = document.querySelectorAll('.mo-single')

    mos.forEach(function (entry, index) {

        // Find all Explanations in each MO Translation
        let explanations = entry.querySelectorAll('.mo-explanation')
        // Find all Anchor-Links in each MO Original
        let explanationLinks = entry.querySelectorAll('a[href^="#"]')
        console.log(explanationLinks)

        // Make Explanations clickable
        explanations.forEach(function (entry, index) {

            entry.addEventListener('click', function (e) {

                if (!e.currentTarget.classList.contains('active')) {
                    // remove .active if assigned to another explanation                 
                    let activeExplanation = document.querySelector('.mo-explanation.active')
                    if (activeExplanation) { activeExplanation.classList.remove('active') }

                    // remove .active if assigned to another link in original text
                    let activeLink = document.querySelector('a[href^="#"].active')
                    if (activeLink) { activeLink.classList.remove('active') }
                }

                // activate clicked explanation and link
                explanationLinks[index].classList.toggle('active')
                e.currentTarget.classList.toggle('active')
                e.currentTarget.closest('.mo-translation').classList.toggle('noscroll-portrait')
                e.currentTarget.scrollTop = 0 /* #### */
            })
        })

        // Make Links in Original Text clickable
        explanationLinks.forEach(function (entry, index) {

            entry.addEventListener('click', function (e) {
                e.preventDefault()

                if (!e.currentTarget.classList.contains('active')) {
                    // remove .active if assigned to another explanation                 
                    let activeExplanation = document.querySelector('.mo-explanation.active')
                    if (activeExplanation) { activeExplanation.classList.remove('active') }

                    // remove .active if assigned to another link in original text
                    let activeLink = document.querySelector('a[href^="#"].active')
                    if (activeLink) { activeLink.classList.remove('active') }
                }

                // activate clicked link and explanation
                explanations[index].classList.toggle('active')
                e.currentTarget.classList.toggle('active')
                e.currentTarget.closest('.mo-single').querySelector('.mo-translation').classList.toggle('noscroll-portrait')
                e.currentTarget.scrollTop = 0
            })

        })
    })
})