#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <LiquidCrystal_I2C.h>
#include <BlynkSimpleEsp32.h>
#include <BlynkTimer.h>

const char *ssid = "Realme";
const char *password = "omartarek";
#define BLYNK_TEMPLATE_ID "TMPL4T3fOcJc0"
#define BLYNK_TEMPLATE_NAME "final"
#define BLYNK_AUTH_TOKEN "h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb"
LiquidCrystal_I2C lcd(0x27, 16, 2);

const int acPin     = 33;  // A0
const int heaterPin = 32;  // A1
const int lightsPin = 35;  // A2

const int acRelay     = 27;  // Control + Digital pin in Blynk
const int heaterRelay = 26;
const int lightsRelay = 25;

const int acLED = 13;
const int heaterLED = 12;
const int lightsLED = 11;

const float totalThreshold = 7.5;
const float restoreThreshold = 3.0;

float acValue = 0, heaterValue = 0, lightsValue = 0, totalLoad = 0;


bool blynkMode = false;
bool acState = true;
bool heaterState = true;
bool lightsState = true;


BlynkTimer timer;

void sendSensorToBlynk() {
  Blynk.virtualWrite(V0, acValue);
  Blynk.virtualWrite(V1, heaterValue);
  Blynk.virtualWrite(V2, lightsValue);
}


BLYNK_WRITE(V3) {
  blynkMode = param.asInt();  // 1 for Blynk control, 0 for local
}

BLYNK_WRITE(V4) {
  acState = param.asInt();
  digitalWrite(acRelay, acState ? HIGH : LOW);
}

BLYNK_WRITE(V5) {
  heaterState = param.asInt();
  digitalWrite(heaterRelay, heaterState ? HIGH : LOW);
}

BLYNK_WRITE(V6) {
  lightsState = param.asInt();
  digitalWrite(lightsRelay, lightsState ? HIGH : LOW);
}


void setup() {
  Serial.begin(115200);
  Serial.println("System Initializing...");

  pinMode(acLED, INPUT);
  pinMode(acRelay, OUTPUT);
  pinMode(heaterRelay, OUTPUT);
  pinMode(lightsRelay, OUTPUT);

  digitalWrite(acRelay, HIGH);
  digitalWrite(heaterRelay, HIGH);
  digitalWrite(lightsRelay, HIGH);

  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.print("Load Shedding");
  lcd.setCursor(0, 1);
  lcd.print("System Ready");
  delay(2000);
  lcd.clear();

  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, password);

  // Send sensor values every 1000ms
  timer.setInterval(1000L, sendSensorToBlynk);
}

void loop() {
  Blynk.run();
  timer.run();

  totalLoad = updateAndRecalculate();

  lcd.setCursor(0, 0);
  lcd.print("Load: ");
  lcd.print(totalLoad);
  lcd.print("    ");

  if (blynkMode) {
    // Blynk controls the relays (no action here in your logic)
  } else {
    if (totalLoad > totalThreshold) {
      if (digitalRead(acRelay) == HIGH) {
        digitalWrite(acRelay, LOW);
        lcd.setCursor(0, 1);
        lcd.print("Shed AC (A0)   ");
        Serial.println("AC Shedded");
        delay(1000);
        lcd.clear();
        return;
      }

      totalLoad = updateAndRecalculate();

      if (totalLoad > totalThreshold && digitalRead(heaterRelay) == HIGH) {
        digitalWrite(heaterRelay, LOW);
        lcd.setCursor(0, 1);
        lcd.print("Shed Heater(A1)");
        Serial.println("Heater Shedded");
        delay(1000);
        lcd.clear();
        return;
      }

      totalLoad = updateAndRecalculate();

      if (totalLoad > totalThreshold && digitalRead(lightsRelay) == HIGH) {
        digitalWrite(lightsRelay, LOW);
        lcd.setCursor(0, 1);
        lcd.print("Shed Lights(A2)");
        Serial.println("Lights Shedded");
        delay(1000);
        lcd.clear();
        return;
      }
    }
    else if (totalLoad < restoreThreshold) {
      if (digitalRead(lightsRelay) == LOW) {
        digitalWrite(lightsRelay, HIGH);
        lcd.setCursor(0, 1);
        lcd.print("Restore Lights ");
        Serial.println("Lights Restored");
        delay(1000);
        lcd.clear();
        return;
      }
      else if (digitalRead(heaterRelay) == LOW) {
        digitalWrite(heaterRelay, HIGH);
        lcd.setCursor(0, 1);
        lcd.print("Restore Heater ");
        Serial.println("Heater Restored");
        delay(1000);
        lcd.clear();
        return;
      }
      else if (digitalRead(acRelay) == LOW) {
        digitalWrite(acRelay, HIGH);
        lcd.setCursor(0, 1);
        lcd.print("Restore AC     ");
        Serial.println("AC Restored");
        delay(1000);
        lcd.clear();
        return;
      }
    }
  }

  delay(200);
}

float updateAndRecalculate() {
  acValue     = analogRead(acPin) * (3.3 / 4095.0);
  heaterValue = analogRead(heaterPin)* (3.3 / 4095.0); // No scaling
  lightsValue = analogRead(lightsPin)* (3.3 / 4095.0); // No scaling
  return acValue + heaterValue + lightsValue;
}
