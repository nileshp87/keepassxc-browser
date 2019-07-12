'use strict';

var kpxcUsernameField = {};
kpxcUsernameField.created = false;
kpxcUsernameField.icon = null;
kpxcUsernameField.inputField = null;

try {
    kpxcUsernameField.observer = new IntersectionObserver((entries) => {
        kpxcUI.updateFromIntersectionObserver(kpxcUsernameField, entries);
    });
} catch (err) {
    console.log(err);
}

kpxcUsernameField.initField = function(field, databaseClosed = true) {
    if (!field || kpxcUsernameField.created) {
        return;
    }

    kpxcUsernameField.created = true;

    // Observer the visibility
    if (kpxcUsernameField.observer) {
        kpxcUsernameField.observer.observe(field);
    }

    kpxcUsernameField.createIcon(field, databaseClosed);
    kpxcUsernameField.inputField = field;
};

kpxcUsernameField.createIcon = function(target, databaseClosed) {
    // Remove any existing password generator icons from the input field
    if (target.getAttribute('kpxc-password-generator')) {
        kpxcPassword.removeIcon(target);
    }

    const field = target;
    const className = kpxcUsernameField.getIconClassName(databaseClosed);
    const size = (field.offsetHeight > 28) ? 24 : 16;
    let offset = Math.floor((field.offsetHeight - size) / 3);
    offset = (offset < 0) ? 0 : offset;

    const icon = kpxcUI.createElement('div', 'kpxc kpxc-username-icon ' + className,
        {
            'title': tr('usernameFieldText'),
            'alt': tr('usernameFieldIcon'),
            'size': size,
            'offset': offset,
            'kpxc-pwgen-field-id': field.getAttribute('data-kpxc-id')
        });
    icon.style.zIndex = '9999';
    icon.style.width = String(size) + 'px';
    icon.style.height = String(size) + 'px';

    icon.addEventListener('click', async function(e) {
        e.preventDefault();

        if (!kpxcFields.isVisible(field)) {
            document.body.removeChild(icon);
            field.removeAttribute('kpxc-username-field');
            return;
        }

        // Triggers database unlock
        _called.manualFillRequested = ManualFill.BOTH;
        await browser.runtime.sendMessage({
            action: 'get_database_hash',
            args: [ false, true ] // Set triggerUnlock to true
        });

        if (icon.className.includes('unlock')) {
            kpxcUsernameField.fillCredentials();
        }
    });

    kpxcUI.setIconPosition(icon, field);
    kpxcUsernameField.icon = icon;
    document.body.appendChild(icon);
};

kpxcUsernameField.switchIcon = function(locked) {
    const icons = $('.kpxc-username-icon');
    if (!icons || icons.length === 0) {
        return;
    }
    const icon = icons;

    if (locked) {
        icon.classList.remove(kpxcUsernameField.getIconClassName());
        icon.classList.add(kpxcUsernameField.getIconClassName(true));
    } else {
        icon.classList.remove(kpxcUsernameField.getIconClassName(true));
        icon.classList.add(kpxcUsernameField.getIconClassName());
    }
};

kpxcUsernameField.getIconClassName = function(locked = false) {
    if (locked) {
        return (isFirefox() ? 'lock-moz' : 'lock');
    }
    return (isFirefox() ? 'unlock-moz' : 'unlock');
};

kpxcUsernameField.fillCredentials = function() {
    const fieldId = kpxcUsernameField.inputField.getAttribute('data-kpxc-id');
    kpxcFields.prepareId(fieldId);
    const givenType = kpxcUsernameField.inputField.type === 'password' ? 'password' : 'username';
    const combination = kpxcFields.getCombination(givenType, fieldId);

    kpxc.fillInCredentials(combination, givenType === 'password', false);
};

// Handle icon position on window resize
window.addEventListener('resize', function(e) {
    kpxcUI.updateIconPosition(kpxcUsernameField);
});

// Handle icon position on scroll
window.addEventListener('scroll', function(e) {
    kpxcUI.updateIconPosition(kpxcUsernameField);
});
