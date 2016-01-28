/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set sw=2 ts=8 et ft=cpp : */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>

namespace mozilla {
namespace hal_impl {

bool
GetScreenEnabled()
{
  return true;
}

void
SetScreenEnabled(bool aEnabled)
{}

bool
GetKeyLightEnabled()
{
  return true;
}

void
SetKeyLightEnabled(bool aEnabled)
{}

// alternative: use libxrand directly
// see http://cgit.freedesktop.org/xorg/app/xbacklight/tree/xbacklight.c
static double read_from_xbacklight() {
  char buf[128];
  double value = 1.0;

  FILE* fp = popen("xbacklight", "r");
  if (fgets(buf, sizeof(buf), fp)) {
    value = atoi(buf) / 100.0;
  }
  pclose(fp);

  return value;
}

static void write_to_xbacklight(double value) {
  char command[128];
  // return directly, because gaia wants performs a fading
  snprintf(command, 128, "xbacklight -set %d -steps 1 &", (int)(value * 100));

  FILE* fp = popen(command, "r");
  pclose(fp);
}

double
GetScreenBrightness()
{
  return read_from_xbacklight();
}

void
SetScreenBrightness(double aBrightness)
{
  write_to_xbacklight(aBrightness);
}

} // namespace hal_impl
} // namespace mozilla
