var users;                  // all users
var albums;                 // all albums
var photos;                 // all photos
var isColumnView = true;    // we are strating in column view so set the bool to true
var currentImageExpanded;   // holds the curently displayed image in full screen

const albumsWrapper = document.getElementsByClassName('wrapper album');
const photosWrapper = document.getElementsByClassName('wrapper photos');

document.addEventListener('scroll', checkForNewDiv);

// style the pages so they start in column view
if (albumsWrapper.length && photosWrapper.length) {
    albumsWrapper[0].style.gridTemplateColumns = "repeat(3, 1fr)";
    photosWrapper[0].style.gridTemplateColumns = "repeat(3, 1fr)";
}

//get data from api
const getAndSortData = async () => {
    // get the users from API
    let responseFromUsers = await fetch('https://jsonplaceholder.typicode.com/users');
    users = await responseFromUsers.json();

    // get the albums from API
    let responseFromAlbums = await fetch('https://jsonplaceholder.typicode.com/albums');
    albums = await responseFromAlbums.json();

    // get the photos from API
    let responseFromPhotos = await fetch('https://jsonplaceholder.typicode.com/photos');
    photos = await responseFromPhotos.json();    

    // add photos to corresponding album
    albums.map(album => Object.defineProperty(album, 'photos', {
        value: photos.filter(photo => {
            if (photo.albumId === album.id)
                return photo;
        }),
        enumerable: true
    }));

    // add albums to corresponding user
    users.map(user => Object.defineProperty(user, 'albums', {
        value: albums.filter(album => {
                if (album.userId === user.id)
                    return album;
            }),
        enumerable: true
    }));
}

getAndSortData()
.then(() => {
    if (albumsWrapper.length) {
        // get the first element on the page
        // and set the class
        let firstElement = document.getElementsByClassName('thumb')[0];
        firstElement.classList.add('album-thumb-' + albums[0].id);

        // get the image of the firs element
        // and set the source and title
        let image = document.getElementsByClassName('thumb-img')[0];
        image.src = albums[0].photos[0].thumbnailUrl;
        image.alt = albums[0].title;

        // get the title and set it to the title of the album
        let title = document.getElementsByClassName('title')[0];
        title.innerHTML = albums[0].title;

        // get the album creator element
        // and set it to coresponding user
        let albumCreator = document.getElementsByClassName('album-creator')[0];
        users.forEach(user => {
            if (user.id === albums[0].id) {
                albumCreator.innerHTML = "Kreirao: " + user.name;
            }
        });

        // add click event to the first element on the page
        firstElement.addEventListener('click', onAlbumClick);

        // check if we should load more items on the page
        checkForNewDiv();
    }
});

// function to create a page
// page - what page are we creating
// wrapperclass - className for wrapping element of an image
// imgSrc - source of an image to display
// title - tite for that image
// albumId - id og an album that we are displayig
// userObject - user object from api
const pageCreate = function(page, wrapperclass, imgSrc, title, albumId, userObject) {

    // function to set attributes for elements
    function setAttributes (el, attrs) {
        for (let key in attrs) {
            el.setAttribute(key, attrs[key])
        }
    }

    // create a wrapper for the displaying image
    let wrapper = document.createElement('div');
    wrapper.classList.add('thumb');
    wrapper.classList.add(wrapperclass);
    wrapper.setAttribute('position', 'relative');

    // create an image, info and title element
    let imgElement = document.createElement('img');
    let infoElement = document.createElement('div');
    let titleElement = document.createElement('div');
    
    // set the attributes for image element
    setAttributes(imgElement, { "src": imgSrc, "alt": title, "class": "thumb-img" });

    // set the attributes for title element and set the title
    setAttributes(titleElement, { "class": "title" });
    titleElement.innerHTML = title;

    // append the title to info element
    infoElement.appendChild(titleElement);

    // append img element to the wrapper container
    // append info element to the wrapper container
    wrapper.appendChild(imgElement);
    wrapper.appendChild(infoElement);

    // if we are on albums page we have to add a creator of the album
    if (page === 'album') {
        // add click event for albums
        wrapper.addEventListener('click', onAlbumClick);

        // create creator element
        // and append it to info element
        let albumCreator = document.createElement('div');

        // set a className for info element
        setAttributes(infoElement, { "class": "info album" });

        // for every album add coresponding creator
        userObject.forEach(user => {
            if (user.id === albumId) {
                setAttributes(albumCreator, { "class": "album-creator"});
                albumCreator.innerHTML = "Kreirao: " + user.name;
                infoElement.appendChild(albumCreator);
            }
        });

        // append wrapper container to the page
        albumsWrapper[0].appendChild(wrapper);
    }
    else {
        // if we are on photos page

        // set attributes for info element
        setAttributes(infoElement, { "class": "info photos" });

        // create a image for trash icon
        let trashIcon = new Image();
        trashIcon.src = '/public/webassets/trash.png';
        trashIcon.setAttribute('class', 'trash-icon');
        trashIcon.setAttribute('alt', 'trash');
        trashIcon.setAttribute('type', 'button');
        infoElement.appendChild(trashIcon);

        // append wrapper container to the page
        photosWrapper[0].appendChild(wrapper);
    }
};

// function that creates photos page from the clicked album
const createPhotosPage = that => {
    // scroll the page to the top
    window.scrollTo(0, 0);

    // get the album id that we are viewing
    let albumId = parseInt(that.classList[1].split('-')[2]);

    // find the photos from that album and create the page
    albums[albumId - 1].photos.forEach(photo => {
        pageCreate('photo', 'photo-thumb' + photo.id, photo.thumbnailUrl, photo.title);
    });

    // if we are in collumn view style it
    if (photosWrapper.length) {
        if (photosWrapper[0].classList.contains('column'))
            photosWrapper[0].style.gridTemplateColumns = "repeat(3, 1fr)";
    }

    // get the buttons for changing the view
    let columnView = document.getElementsByClassName('column-view photos')[0];
    let rowView = document.getElementsByClassName('row-view photos')[0];

    // add event listeners to view buttons
    columnView.addEventListener('click', function() {
        // change the view to column view
        viewChange(photosWrapper, this);
    });
    rowView.addEventListener('click', function() {
        // change the view to row view
        viewChange(photosWrapper, this);
    });
    
    // get the album title element
    let albumTitle = that.querySelector('.title').innerHTML;
    // get the back button element
    let backButton = document.getElementsByClassName('go-back')[0];

    // add click event for back button
    backButton.addEventListener('click', onBackClick);

    // change the title of the album that we are currently viewing
    document.getElementsByClassName('header-title photos')[0].innerHTML = albumTitle;

    // add click event for every photo
    photosWrapper[0].querySelectorAll('.thumb-img').forEach(photo => {
        photo.addEventListener('click', onPhotoClick);
    });
    
    // get navigational arrows
    let navigationArrows = document.querySelectorAll('.left, .right')
    // add cick events on nav arrows
    navigationArrows.forEach(arrow => arrow.addEventListener('click', navArrowClick));

    // get trash icon
    let trashIcon = document.getElementsByClassName('trash-icon');
    // add click event for all the trash icons on the page
    for (const trash of trashIcon) {
        trash.addEventListener('click', deletePopup);
    }

    // get search element
    let inputField = document.getElementById('search');
    // add keyup event for typing
    inputField.addEventListener('keyup', () => searchFunction(inputField.value));
};

// function on back button click
const onBackClick = () => {

    // on goBack delete all the images from photos page
    let images = document.querySelectorAll('.wrapper.photos');
    while (images[0].lastElementChild) {
        images[0].removeChild(images[0].lastElementChild);
    }

    // hide photos page
    document.getElementsByClassName('photos-page')[0].style.display = "none";
    
    // show albums page
    document.getElementsByClassName('albums-page')[0].style.display = "block";

}

// function to display delete popup and delete/or not the image
function deletePopup(e) {
    // get the cliked trash icon
    let targetElement = e.target;
    // get the popup and show it
    let popup = document.getElementsByClassName('popup')[0]
    popup.style.display = 'block';

    // get delete/not delete buttons
    let daButton = document.getElementsByClassName('popup-buttons da')[0];
    let neButton = document.getElementsByClassName('popup-buttons ne')[0];

    // add click event for delete button
    daButton.addEventListener('click', function(){
        // delete the image and remove popup
        targetElement.closest('.thumb').remove();
        popup.style.display = 'none';
    });

    // add click event for not delete button
    neButton.addEventListener('click', function(){
        // close popup
        popup.style.display = 'none';
    });
}

// function to get the photo for full screen display
// title - title of the photo
function getPhoto (title) {
    // find the photo in photos array
    photos.find(photo => {
        // if the photsos title is the same as title from the clicked phooto, 
        // display it in full screen
        if (photo.title === title) {
            // get the element fot the photo
            // set the source and display it 
            let expandedImg = document.getElementsByClassName('expandedImg')[0];
            expandedImg.src = photo.url;
            expandedImg.parentElement.style.display = 'block';
            return;
        }
    });
}

// function for clicking on navigational arrows
function navArrowClick(e) {
    // holds the title of the previous/next image
    let title; 

    // check if we clicked left/right arrow
    if (e.target.classList.contains('left')) {
        // set the title of the new image
        title = currentImageExpanded.previousElementSibling.getElementsByClassName('title')[0].innerHTML;

        // change the curent displayed image to a new image
        currentImageExpanded = currentImageExpanded.previousElementSibling;
    }
    else {
        // set the title of the new image
        title = currentImageExpanded.nextElementSibling.getElementsByClassName('title')[0].innerHTML;

        // change the curent displayed image to a new image
        currentImageExpanded = currentImageExpanded.nextElementSibling;
    }
    
    // get the photo for the full screen display
    getPhoto(title);
}

// function for clicking on the photo
function onPhotoClick(e) {
    // set ste currently displayed image
    currentImageExpanded = e.target.parentElement;
    
    // get the photo for the full screen display
    getPhoto(e.target.getAttribute('alt'));
}

// function to search the photos
// value - input value
function searchFunction(value){
    // get all the images
    let images = document.getElementsByClassName('wrapper photos')[0].children;

    for (const image of images) {
        // get the title of the image
        let imageTitle = image.getElementsByClassName('title')[0].innerHTML;

        // check if the image has a search input value in its title;
        // does have: keep it on the page
        // does not have: hide it
        imageTitle.indexOf(value) > -1 ? image.style.display = 'block' : image.style.display = 'none';
    }
}

// function when we click on album 
const onAlbumClick = function() {
    // hide albums page
    document.getElementsByClassName('albums-page')[0].style.display = "none";

    // show photos page
    document.getElementsByClassName('photos-page')[0].style.display = "block";

    // create photos page
    createPhotosPage(this);
};

//function to check if we can load new element to the page
function checkForNewDiv() {
    // album id
    let albumId;
    // last div on the page
    var lastDiv = document.querySelector(".wrapper.album > div:last-child");
    // last div offset
    var lastDivOffset = lastDiv.offsetTop + lastDiv.clientHeight;
    // page offset
    var pageOffset = window.pageYOffset + window.innerHeight;

    if (lastDiv.classList.length > 1) {
        // check if we are on albums page
        // get the album id
        if (lastDiv.parentElement.classList.contains('album'))
            albumId = parseInt(lastDiv.classList[1].split('-')[2]);

        // chck the page offset
        if (pageOffset > lastDivOffset - 10 && albumId < albums.length) {
            // create new element on the page
            pageCreate('album', 'album-thumb-' + albums[albumId].id, albums[albumId].photos[0].thumbnailUrl, albums[albumId].title, albums[albumId].userId,users);

            // info of the newly created element
            let info = lastDiv.nextElementSibling.getElementsByClassName('info')[0];
            // see if we are on a row view
            // and do the styling
            let isRowView = document.getElementsByClassName('wrapper album')[0].classList.contains('row');
            if (isRowView) {
                info.style.display = "inline-block";
                info.style.position = "absolute";
                info.style.paddingLeft = "26px";
                lastDiv.nextElementSibling.style.paddingBottom = "30px";
            }
            
            // check if we can load new element
            checkForNewDiv();
        }
    }
}

// function to check on what view on the page are we on
const viewChange = function (wrapper, that) {
    // row view
    let lines;
    // column view
    let rectangles;

    // check if we clicked the view that are we currently on
    if ((that.classList.contains('column-view') && isColumnView) || (that.classList.contains('row-view') && !isColumnView)) return;
    
    // are we on a column view
    if (wrapper.length)
        isColumnView = wrapper[0].classList.contains('column');

    // function that does styling of the page upon view change
    // view - view that we are changing to
    let styleInfo = (view, wrapper) => {
        // info element
        let info;
        // image element
        let thumb;

        // get the info and image element based on the page we are on
        if (wrapper[0].classList.contains('album')) {
            thumb = document.getElementsByClassName('wrapper album');
            info = document.getElementsByClassName('info album');
        }
        else {
            thumb = document.getElementsByClassName('wrapper photos');
            info = document.getElementsByClassName('info photos');
        }

        // we are changing to row view
        // do the styling
        if (view === "row") {
            for (let i = 0; i < thumb[0].children.length; i++) {
                info[i].style.display = "inline-block";
                info[i].style.position = "absolute";
                info[i].style.paddingLeft = "26px";
                thumb[0].children[i].style.paddingBottom = "30px";
            }
        }
        // we are changing to column voew
        // do the styling
        else {
            for (let i = 0; i < thumb[0].children.length; i++) {
                info[i].style.display = "";
                info[i].style.position = "";
                info[i].style.paddingLeft = "";
                thumb[0].children[i].style.paddingBottom = "";
            }
        }
    }

    // get the view buttons based on the current view
    if (wrapper[0].classList.contains('album'))
    {
        lines = document.querySelectorAll('.line.albums');
        rectangles = document.querySelectorAll('.rectangle.albums');
    }
    else {
        lines = document.querySelectorAll('.line.photos');
        rectangles = document.querySelectorAll('.rectangle.photos');
    }

    // change the color of the view buttons and add class to wrapper element based on the view
    if (isColumnView) {
        lines.forEach(line => line.style.backgroundColor = '#000000');
        rectangles.forEach(rectangle => rectangle.style.backgroundColor = '#E5E5E5');
        wrapper[0].classList.remove("column");
        wrapper[0].classList.add("row");
        wrapper[0].style.gridTemplateColumns = "";
        isColumnView = false;

        // style the page
        styleInfo("row", wrapper);
    }
    else {
        rectangles.forEach(rectangle => rectangle.style.backgroundColor = '#000000');
        lines.forEach(line => line.style.backgroundColor = '#E5E5E5');
        wrapper[0].classList.remove("row");
        wrapper[0].classList.add("column");
        wrapper[0].style.gridTemplateColumns = "repeat(3, 1fr)";
        isColumnView = true;

        // style the page
        styleInfo("colum", wrapper);
    }
};

let columnView = document.getElementsByClassName('column-view albums')[0];
let rowView = document.getElementsByClassName('row-view albums')[0];

columnView.addEventListener('click', function() {
    viewChange(albumsWrapper, this);
});
rowView.addEventListener('click', function() {
    viewChange(albumsWrapper, this);
});