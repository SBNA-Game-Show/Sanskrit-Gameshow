function Cel_Fah() {
    var Tempvalue = document.getElementById('txtData').value;

    var CelToFah = ((Tempvalue * 9) / 5 + 32).toFixed(2);
    var final = Tempvalue + "°C is " + CelToFah + " °F.";

    document.getElementById('result').innerHTML=final;
  }
  function Fah_Cel() {
    var Tempvalue = document.getElementById('txtData').value;
    
    var fahToCel = (((Tempvalue - 32) * 5) / 9).toFixed(2);
    var final1 = Tempvalue + "°F is " + fahToCel + "°C.";

    document.getElementById('result').innerHTML=final1;

  }
  function Feet_Meters() {
    var Tempvalue = document.getElementById('txtData').value;
    
    var FeettoMeter = (Tempvalue / 3.2808).toFixed(2);
    var final2 = Tempvalue + " feet is " + FeettoMeter + " meters";

    document.getElementById('result').innerHTML=final2;

  }
  function Meters_Feet() {
    var Tempvalue = document.getElementById('txtData').value;
    
    var MeterstoFeet = (Tempvalue * 3.2808).toFixed(2);
    var final3 = Tempvalue + " meters is " + MeterstoFeet + " feet.";

    document.getElementById('result').innerHTML=final3;

  }
  function Inch_Cent() {
    var Tempvalue = document.getElementById('txtData').value;
    
    var InchtoCent = (Tempvalue * 2.54).toFixed(2);
    var final4 = Tempvalue + " inches is " + InchtoCent + " cm.";

    document.getElementById('result').innerHTML=final4;

  }
  function Cent_Inch() {
    var Tempvalue = document.getElementById('txtData').value;
    
    var CenttoInch = (Tempvalue / 2.54).toFixed(2);
    var final5 = Tempvalue + " cm is " + CenttoInch + " inches.";

    document.getElementById('result').innerHTML=final5;

  } 
  function Poun_Kilo() {
    var Tempvalue = document.getElementById('txtData').value;
    
    var PountoKilo = (Tempvalue / 2.2046).toFixed(2);
    var final6 = Tempvalue + " pounds is " + PountoKilo + " kilograms.";

    document.getElementById('result').innerHTML=final6;

  }
  function Kilo_Poun() {
    var Tempvalue = document.getElementById('txtData').value;
    
    var KilotoPoun = (Tempvalue * 2.2046).toFixed(2);
    var final7 = Tempvalue + " kilograms is " + KilotoPoun + " pounds.";

    document.getElementById('result').innerHTML=final7;

  }

  function reseter() {
    document.getElementById('myForm').reset();
    document.getElementById('result').innerHTML = "";
    document.getElementById("txtData").focus();
    }