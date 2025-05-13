const Treatment = require("../models/Treatment");

// ✅ Get all treatments
exports.getAllTreatments = async (req, res) => {
    try {
        const treatments = await Treatment.find();

        // Ensure proper formatting of price fields
        const formattedTreatments = treatments.map((treatment) => {
            const { name, price, minPrice, maxPrice, _id } = treatment;

            let parsedMinPrice = minPrice;
            let parsedMaxPrice = maxPrice;

            // Parse price string if it exists
            if (price && typeof price === "string" && price.includes("-")) {
                const [min, max] = price.split("-").map((p) => parseFloat(p.replace(/,/g, "").trim()));
                if (!isNaN(min) && !isNaN(max)) {
                    parsedMinPrice = min;
                    parsedMaxPrice = max;
                }
            }

            return {
                _id,
                name,
                price: parsedMinPrice === null && parsedMaxPrice === null ? price : null, // Keep original price string if no range
                minPrice: parsedMinPrice || null,
                maxPrice: parsedMaxPrice || null,
            };
        });

        res.json(formattedTreatments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch treatments" });
    }
};

// ✅ Add a new treatment
exports.addTreatment = async (req, res) => {
    const { name, price, minPrice, maxPrice } = req.body;

    if (!name || (price === undefined && (minPrice === undefined || maxPrice === undefined))) {
        return res.status(400).json({ error: "Treatment name and either price or price range are required" });
    }

    if (price !== undefined && price < 0) {
        return res.status(400).json({ error: "Price cannot be negative" });
    }

    if (minPrice !== undefined && maxPrice !== undefined && (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice)) {
        return res.status(400).json({ error: "Invalid price range" });
    }

    try {
        const newTreatment = new Treatment({
            name,
            price: price || null,
            minPrice: minPrice || null,
            maxPrice: maxPrice || null
        });
        await newTreatment.save();
        res.json({ message: "Treatment added successfully", treatment: newTreatment });
    } catch (error) {
        res.status(500).json({ error: "Failed to add treatment" });
    }
};

// ✅ Update treatment
exports.updateTreatment = async (req, res) => {
    const { name, price, minPrice, maxPrice } = req.body;

    if (price !== undefined && price < 0) {
        return res.status(400).json({ error: "Price cannot be negative" });
    }

    if (minPrice !== undefined && maxPrice !== undefined && (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice)) {
        return res.status(400).json({ error: "Invalid price range" });
    }

    try {
        const updatedTreatment = await Treatment.findByIdAndUpdate(
            req.params.id,
            {
                name,
                price: price || null,
                minPrice: minPrice || null,
                maxPrice: maxPrice || null
            },
            { new: true, runValidators: true }
        );

        if (!updatedTreatment) {
            return res.status(404).json({ error: "Treatment not found" });
        }

        res.json({ message: "Treatment updated successfully", treatment: updatedTreatment });
    } catch (error) {
        res.status(500).json({ error: "Failed to update treatment" });
    }
};

// ✅ Delete a treatment
exports.deleteTreatment = async (req, res) => {
    try {
        await Treatment.findByIdAndDelete(req.params.id);
        res.json({ message: "Treatment deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete treatment" });
    }
};