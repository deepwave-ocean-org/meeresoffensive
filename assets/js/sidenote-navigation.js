document.addEventListener('DOMContentLoaded', function () {

    let mos = document.querySelectorAll('.mo-single')

    function removeAllActive() {
        let activeExplanation = document.querySelector('.mo-explanation.active')
        if (activeExplanation) { activeExplanation.classList.remove('active') }

        let activeLink = document.querySelector('a[href^="#"].active')
        if (activeLink) { activeLink.classList.remove('active') }
    }

    function scrollInParentView(child, parent, offset = 15) {
        parent.scrollTo({
            top: child.offsetTop - offset,
            behavior: 'smooth'
        });
    }

    mos.forEach(function (section, index) {

        // Find all Explanations in each MO Translation
        let explanations = section.querySelectorAll('.mo-explanation')
        // Find all Anchor-Links in each MO Original
        let explanationLinks = section.querySelectorAll('a[href^="#"]')
        let original = section.querySelector(".mo-main-content")
        let explanationContainer = section.querySelector(".mo-translation")

        const wrapper = section.querySelector(".mo-cta-wrapper")
        // Make Explanations clickable
        explanations.forEach(function (entry, index) {

            entry.querySelector("h3").addEventListener('click', function (e) {
                if (entry.classList.contains('active')) {
                    removeAllActive()
                    return
                }
                console.log("hellooooo", entry)
                if (entry.classList.contains("mo-cta-button")) {
                    wrapper.classList.add("active")
                    scrollInParentView(wrapper, explanationContainer, -2)
                }
                removeAllActive()
                explanationLinks[index].classList.toggle('active')
                scrollInParentView(explanationLinks[index], original)
                entry.classList.toggle('active')
                scrollInParentView(entry, explanationContainer)
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
                scrollInParentView(explanations[index], explanationContainer)
            })
        })
        const closeHandle = section.querySelector(".mo-close-handle")
        if (closeHandle) {
            closeHandle.addEventListener("click",
                () => {
                    explanationContainer.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    wrapper.classList.remove("active")
                }
            )
        }

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
            console.log("helloooo")
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
                if (window.matchMedia('(max-width: 767px)').matches) {
                    entry.classList.toggle('active');
                } else {
                    window.open(link, '_blank');
                }
            }
        })
    })
})