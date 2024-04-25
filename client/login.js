document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username');
    const password = document.getElementById('password');

    if (username.value === 'admin' && password.value === 'password') {
        fetch('http://localhost:4000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username.value })
        })
        .then(response => response.json())
        .then(data => {
            const accessToken = data.accessToken;
            fetch('http://localhost:4000/posts', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            .then(response => response.json())
            .then(posts => {
                const postsList = document.getElementById('postsList');
                postsList.innerHTML = ''; // Clear previous posts
                posts.forEach(post => {
                    const li = document.createElement('li');
                    li.classList.add('post-item');
                    const idSpan = document.createElement('span');
                    idSpan.classList.add('post-id');
                    idSpan.textContent = `${post.id}`;
                    const usernameSpan = document.createElement('span');
                    usernameSpan.classList.add('post-username');
                    usernameSpan.textContent = `${post.username}`;
                    const postContentSpan = document.createElement('span');
                    postContentSpan.classList.add('post-content');
                    postContentSpan.textContent = `${post.post}`;
                    li.appendChild(idSpan);
                    li.appendChild(postContentSpan);
                    li.appendChild(usernameSpan);
                    postsList.appendChild(li);
                });
                const h2 = document.querySelector('h2');
                postsList.classList.remove('hide');
                h2.classList.add('hide');
                username.value = "";
                password.value = "";
            });
        });
    } else {
        alert('아이디와 비밀번호를 확인하세요.');
    }
});