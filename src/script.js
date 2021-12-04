const data = {
    _users: {},
    _ratedUsers: {},
    set users(users) {
        this._users = users;
    },
    get users() {
        return Object.values(this._users);
    },
    set ratedUsers(users) {
        this._ratedUsers = users;
    },
    get ratedUsers() {
        return Object.values(this._ratedUsers);
    },
    getUserById(id) {
        return this._users[id];
    },
    getSortedRatedUsers(isDesc = false) {
      return this.ratedUsers.sort((userA, userB) => isDesc
          ? userB.count - userA.count
          : userA.count - userB.count);
    },
    isFriendsPair(leftId, rightId) {
        return !!this.getUserById(leftId).friends[rightId];
    }
};

const usersAdapter = (rawUsers) => {
    let users = rawUsers.reduce((acc, user) => {
        return {
            ...acc,
            [user.id]: user
        };
    }, {});

    for (const key in users) {
        const user = users[key];
        const {friends} = user;
        user.friends = friends.reduce((acc, friend) => {
            return {
                ...acc,
                [friend]: users[friend].name
            };
        }, {});
    }

    return users;
};

const getRatedUsers = (users) => {
    return users.reduce((acc, user) => {
        const {friends} = user;
        let result = {};

        for (const key in friends) {
            const rated = acc[key];

            if (rated) {
                rated.count++;
            } else {
                result[key] = {
                    id: key,
                    name: data.getUserById(key).name,
                    count: 1
                }
            }
        }

        return {
            ...acc,
            ...result
        };
    }, {});
};

const loadDataInto = (data) => {
    return fetch('../data.json').then(data => data.json()).then(json => {
        data.users = usersAdapter(json);
        data.ratedUsers = getRatedUsers(data.users);
        return data.users;
    });
}

const getUserTemplate = (user, classes) => {
    const {id, name} = user;

    return (
        `<li class="${classes.join(' ')}" data-id="${id}">
            <strong>${name}</strong>
        </li>`
    );
};

const getListItemSectionTemplate = ({title, users}) => {
    return (
        `<li class="details-view__item">
            <strong class="details-view__title">${title}</strong>
        </li>
        ${
            users
                .map((user) => getUserTemplate(user, ["details-view__item", "list__item person"]))
                .join(' ')
        }`
    );
};

const getDetailsEl = (user) => {
    const {id, name, friends} = user;

    const title = {
        FRIENDS: 'Друзья',
        NOT_FRIENDS: 'Не друзья',
        POPULAR_FRIENDS: 'Популярные люди'
    };

    const sections = [
        {
            title: title.FRIENDS,
            users: Object.keys(friends).map((friendId) => data.getUserById(friendId)),
        },
        {
            title: title.NOT_FRIENDS,
            users: data.users
                .filter((user) => `${id}` !== `${user.id}` && !data.isFriendsPair(id, user.id))
                .slice(0, 3),
        },
        {
            title: title.POPULAR_FRIENDS,
            users: data.getSortedRatedUsers(true)
                .filter((user) => `${id}` !== `${user.id}`)
                .slice(0, 3),
        },
    ];
    debugger
    const wrapper = document.createElement('div');
    wrapper.classList.add('details-view');
    wrapper.innerHTML = (
        `<div class="details-view__user person">
            <span class="details-view__exit-button"></span>
            <strong>${name}</strong>
        </div>
        <ul class="list">
            ${
                sections
                    .map((section) => getListItemSectionTemplate(section))
                    .join(' ')
            }
        </ul>`
    );
    return wrapper;
};

const insertTemplateInto = (container, template) => {
    container.insertAdjacentHTML('beforeend', template);
};

const renderDataInto = (container, data) => {
    data.forEach((user) => insertTemplateInto(container, getUserTemplate(user, ['list__item', 'person'])));
};

const wrapperEl = document.querySelector('.wrapper');
const usersContainerEl = document.querySelector('.list-view.list');

loadDataInto(data).then(users => renderDataInto(usersContainerEl, users));

usersContainerEl.addEventListener('click', (event) => {
    const target = event.target.closest('.list__item.person');
    const user = data.getUserById(target.dataset.id);
    const detailEl= getDetailsEl(user);

    wrapperEl.append(detailEl);
    usersContainerEl
        .addEventListener('click', detailEl.remove.bind(detailEl));
    detailEl
        .querySelector('.details-view__exit-button')
        .addEventListener('click', detailEl.remove.bind(detailEl))
});
