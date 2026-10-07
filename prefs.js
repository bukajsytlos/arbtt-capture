// Copyright (C) 2017 Tomasz Miąsko
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// Extension settings widget.

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import * as Arbtt from './arbtt.js';
import * as Settings from './settings.js';

export default class ArbttCapturePreferences extends ExtensionPreferences {

    fillPreferencesWindow(window) {
        const settings = Settings.getSettings(this);

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup();
        page.add(group);
        window.add(page);

        // Row for sampling-interval.
        const intervalRow = new Adw.SpinRow({
            title: 'Sampling interval in seconds',
            tooltip_text: 'Interval between samples. Expressed in seconds.',
            adjustment: new Gtk.Adjustment({lower: 1, upper: 5 * 60, step_increment: 10}),
        });
        settings.bind('sampling-interval', intervalRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        group.add(intervalRow);

        // Row for log-path.
        const logRow = new Adw.ActionRow({
            title: 'Log location',
            use_markup: false,
            activatable: true,
        });
        logRow.add_suffix(new Gtk.Image({icon_name: 'document-open-symbolic'}));
        settings.bind('log-path', logRow, 'subtitle', Gio.SettingsBindFlags.DEFAULT);
        logRow.connect('activated', () => {
            const dialog = new Gtk.FileDialog({title: 'Log location'});
            dialog.set_initial_file(Gio.File.new_for_path(settings.get_string('log-path')));
            dialog.save(window, null, (dialog, result) => {
                try {
                    settings.set_string('log-path', dialog.save_finish(result).get_path());
                } catch (e) {
                    if (!e.matches(Gtk.DialogError, Gtk.DialogError.DISMISSED)) {
                        logError(e);
                    }
                }
            });
        });
        group.add(logRow);

        // Row for arbtt-import-path.
        const importRow = new Adw.EntryRow({
            title: 'Location of arbtt-import',
            tooltip_text: 'Location of the arbtt-import program, or program name to lookup using PATH environment variable.',
        });
        settings.bind('arbtt-import-path', importRow, 'text', Gio.SettingsBindFlags.DEFAULT);

        const errorIcon = new Gtk.Image({icon_name: 'dialog-error-symbolic', visible: false});
        importRow.add_suffix(errorIcon);

        const validateImportEntry = () => {
            if (importRow.get_text().length === 0) {
              const [defaultValue] = settings.get_default_value('arbtt-import-path').get_string();
              importRow.set_text(defaultValue);
            }

            try {
                const program = importRow.get_text();
                Arbtt.checkFeatures(program);
                errorIcon.visible = false;
                errorIcon.tooltip_text = null;
                importRow.remove_css_class('error');
            } catch (e) {
                errorIcon.visible = true;
                errorIcon.tooltip_text = e.toString();
                importRow.add_css_class('error');
            }
        };

        // Validate entry when focus is lost and when enter key is pressed.
        const focusController = new Gtk.EventControllerFocus();
        focusController.connect('leave', validateImportEntry);
        importRow.add_controller(focusController);
        importRow.connect('entry-activated', validateImportEntry);
        group.add(importRow);
    }
}
