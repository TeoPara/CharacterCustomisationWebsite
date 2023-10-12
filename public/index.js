let socket = io();
socket.on('account_message', message =>
{
    document.getElementById('Message').innerText = message;
    console.log(message);
    
    if (message == "Login completed")
    {
        document.getElementById('loginStatus').innerHTML = "Currently logged in";
        document.getElementById('LoginOptions').style.display = 'none';
        document.getElementById('LogoutButton').style.display = '';
    }
    else
    {
        document.getElementById('loginStatus').innerHTML = "Currently not logged in";
        document.getElementById('LoginOptions').style.display = '';
        document.getElementById('LogoutButton').style.display = 'none';
    }
});

socket.on('refresh', args=>
{
    location.reload();
});

// Args:
// 0 Index
// 1 Name
// 2 Armor
// 3 Pants
// 4 Color
//   [
//       [ Armor R, G, B ]
//       [ Pants R, G, B ]
//       [ Skin  R, G, B ]
//   ]
socket.on('warrior', args =>
{
    const A = document.createElement('iframe');
    document.body.appendChild(A);
    A.setAttribute('src', "warrior.html");
    A.style="border-width:0px; width:625px; height:500px";

    A.onload = bruh;
    function bruh()
    {
        A.contentWindow.document.getElementById('index').innerHTML = args[0];
        A.contentWindow.document.getElementById('hname').innerHTML = args[1];
        if (args[2])
            A.contentWindow.document.getElementById('armor').src = "img/armor.png";
        if (args[3])
            A.contentWindow.document.getElementById('pants').src = "img/pants.png";
        
        console.log(args.length);
        
        A.contentWindow.document.getElementById('armorRed').style.opacity = args[4][0][0];
        A.contentWindow.document.getElementById('armorGreen').style.opacity = args[4][0][1];
        A.contentWindow.document.getElementById('armorBlue').style.opacity = args[4][0][2];
        A.contentWindow.document.getElementById('armorR').setAttribute('value', args[4][0][0] * 200);
        A.contentWindow.document.getElementById('armorG').setAttribute('value', args[4][0][1] * 200);
        A.contentWindow.document.getElementById('armorB').setAttribute('value', args[4][0][2] * 200);
        
        A.contentWindow.document.getElementById('pantsRed').style.opacity = args[4][1][0];
        A.contentWindow.document.getElementById('pantsGreen').style.opacity = args[4][1][1];
        A.contentWindow.document.getElementById('pantsBlue').style.opacity = args[4][1][2];
        A.contentWindow.document.getElementById('pantsR').setAttribute('value', args[4][1][0] * 200);
        A.contentWindow.document.getElementById('pantsG').setAttribute('value', args[4][1][1] * 200);
        A.contentWindow.document.getElementById('pantsB').setAttribute('value', args[4][1][2] * 200);

        A.contentWindow.document.getElementById('skinRed').style.opacity = args[4][2][0];
        A.contentWindow.document.getElementById('skinGreen').style.opacity = args[4][2][1];
        A.contentWindow.document.getElementById('skinBlue').style.opacity = args[4][2][2];
        A.contentWindow.document.getElementById('skinR').setAttribute('value', args[4][2][0] * 200);
        A.contentWindow.document.getElementById('skinG').setAttribute('value', args[4][2][1] * 200);
        A.contentWindow.document.getElementById('skinB').setAttribute('value', args[4][2][2] * 200);
    }
});


function account_register()
{
    var user = document.getElementById('Username').value;
    var pass = document.getElementById('Password').value;

    console.log("Sending account_register " + user + ", " + CryptoJS.MD5(pass));
    socket.emit('account_register', [String(user), String(CryptoJS.MD5(pass))]);
}
function account_login()
{
    var user = document.getElementById('Username').value;
    var pass = document.getElementById('Password').value;

    console.log("Sending account_login " + user + ", " + CryptoJS.MD5(pass));
    socket.emit('account_login', [String(user), String(CryptoJS.MD5(pass))]);
}
function account_logout()
{
    console.log("Sending account_logout");
    socket.emit('account_logout');
}

function update(array)
{
    socket.emit('update', array);
}