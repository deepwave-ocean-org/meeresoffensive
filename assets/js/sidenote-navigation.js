document.addEventListener('DOMContentLoaded', function () {

    let mos = document.querySelectorAll('.mo-single')

    function removeAllActive() {
        let activeExplanation = document.querySelector('.mo-explanation.active')
        if (activeExplanation) { activeExplanation.classList.remove('active') }

        let activeLink = document.querySelector('a[href^="#"].active')
        if (activeLink) { activeLink.classList.remove('active') }
    }

    mos.forEach(function (entry, index) {

        // Find all Explanations in each MO Translation
        let explanations = entry.querySelectorAll('.mo-explanation')
        // Find all Anchor-Links in each MO Original
        let explanationLinks = entry.querySelectorAll('a[href^="#"]')

        // Make Explanations clickable
        explanations.forEach(function (entry, index) {

            entry.querySelector("h3").addEventListener('click', function (e) {
                if (entry.classList.contains('active')) {
                    removeAllActive()
                    return
                }
                removeAllActive()
                explanationLinks[index].classList.toggle('active')
                entry.classList.toggle('active')
            })
        })

        // Make Links in Original Text clickable
        explanationLinks.forEach(function (entry, index) {
            entry.addEventListener('click', function (e) {
                e.preventDefault()
                if (entry.classList.contains('active')) {
                    removeAllActive()
                    return
                }
                removeAllActive()
                explanations[index].classList.toggle('active')
                e.currentTarget.classList.toggle('active')
            })
        })
    })

    // expanders
    let expanders = document.querySelectorAll('.trigger')
    expanders.forEach(function (entry, index) {
        entry.addEventListener('click', function (e) {
            e.stopPropagation()
            e.currentTarget.closest('.expander').classList.toggle('active')
        })
    })

    // sidenotes
    let sidenotes = document.querySelectorAll('.sidenote')
    sidenotes.forEach(function (entry, index) {
        //A) Sidenotes beside text: entry.querySelector('cite').addEventListener('click', function(e){
        //B) Sidenotes within text:
        entry.addEventListener('click', function (e) {
            e.stopPropagation()
            let link = e.currentTarget.querySelector('a').getAttribute('href')

            // LINK internal
            if (link.includes('#')) {
                // do something
                alert('jump to internal link — TO BE IMPLEMENTED')

                // IMAGE lightBox
            } else if (link.includes('cloudinary.com')) {
                // Open image in lightbox
                let lightboxContent = '<div class="mo-lightbox"><img src="' + link + '" /></div><div class="mo-close-handle"></div>'
                let lightboxInstance = basicLightbox.create(lightboxContent, {
                    onShow: (instance) => {
                        document.getElementsByTagName('body')[0].classList.add('overlay-is-active')
                        setTimeout(() => {
                            document.querySelector('.mo-lightbox + .mo-close-handle').addEventListener('click', function () {
                                instance.close()
                            })
                        }, 50)
                    },
                    onClose: () => { document.getElementsByTagName('body')[0].classList.remove('overlay-is-active') }
                }).show()

                // LINK external
            } else {
                window.open(link, '_blank')
            }
        })
    })
})